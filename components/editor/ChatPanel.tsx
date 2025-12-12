import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, UserProfile } from '../../types';
import { Send, User, Sparkles, Loader2, Brain } from 'lucide-react';
import { sendChatFollowUp } from '../../services/geminiService';
import { saveChatSession, getChatSession } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

interface ChatPanelProps {
  promptId: string;
  userEmail: string | undefined;
  user: UserProfile | null;
  contentContext: string; // We need the content context for the AI to answer questions about it
}

const CHAT_SYSTEM_INSTRUCTION = `You are a highly capable AI educational consultant and writing assistant.

The user has generated educational content which is provided in the context.
Your goal is to help the user refine, expand, or understand this content.

GUIDELINES FOR RESPONSE:
1. **CLARITY & CONCISENESS**: Be direct, friendly, and efficient. Avoid unnecessary fluff or overly robotic pleasantries. Get straight to the pedagogical value.
2. **DEPTH & DETAIL**: While being concise, do not oversimplify complex topics. Provide detailed, evidence-based reasoning, specific examples, or actionable steps when the user asks for advice or revisions.
3. **CONTEXT AWARENESS**: Always reference the specific content provided in the context when answering.
4. **PROFESSIONAL TONE**: Maintain a supportive, academic, yet accessible tone suitable for professional educators.
5. **FORMATTING**: Use paragraphs, bullet points, and spacing to make your response easy to scan. Do NOT use Markdown code blocks or HTML tags; use standard text formatting.`;

const ChatPanel: React.FC<ChatPanelProps> = ({ promptId, userEmail, user, contentContext }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load History on Mount or Prompt Change
  useEffect(() => {
    if (userEmail && promptId) {
      setIsLoadingHistory(true);
      getChatSession(userEmail, promptId)
        .then((msgs) => {
          setMessages(msgs || []);
        })
        .catch((err) => {
          console.error("Failed to load chat history", err);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
        setMessages([]);
    }
  }, [userEmail, promptId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);

    // Auto-save user message to persistence layer
    if (userEmail) saveChatSession(userEmail, promptId, updatedMessages);

    try {
      // Send to Gemini
      // We use the accumulated messages as history for context
      const responseText = await sendChatFollowUp(
        'gemini-2.5-flash',
        contentContext,
        updatedMessages.map(m => ({ role: m.role, text: m.text })),
        userMessage.text,
        CHAT_SYSTEM_INSTRUCTION // Pass the custom instruction here
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Auto-save AI message to persistence layer
      if (userEmail) saveChatSession(userEmail, promptId, finalMessages);

    } catch (error) {
      console.error(error);
      addToast("Failed to get response from AI.", 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {isLoadingHistory && (
            <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        )}
        
        {!isLoadingHistory && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-slate-100 relative">
              <img 
                src="https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png" 
                alt="AI Assistant" 
                className="w-10 h-10 object-contain relative z-10" 
              />
              <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="font-medium text-slate-900 mb-1">AI Pedagogical Assistant</h3>
            <p className="text-sm max-w-xs mx-auto">I'm here to help you refine your lesson plans. Ask me to expand sections, suggest activities, or critique the methodology.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden border border-slate-200 bg-white shadow-sm`}>
                  {msg.role === 'user' ? (
                    <img 
                      src={user?.picture || "https://ui-avatars.com/api/?name=User"} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <img 
                      src="https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png" 
                      alt="AI School Hub" 
                      className="w-full h-full object-contain p-0.5" 
                    />
                  )}
                </div>
                
                {/* Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                  <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Thinking Indicator Animation */}
        {isSending && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[80%] gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                <Brain size={18} className="text-primary animate-pulse" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Analyzing content & thinking...</span>
                 </div>
                 <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 animate-[shimmer_1.5s_infinite] w-full"></div>
                 </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 z-10">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for deep analysis, revisions, or suggestions..."
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-800 placeholder-slate-400 shadow-inner"
            disabled={isSending}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-400">
            AI can make mistakes. Please review generated content.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;