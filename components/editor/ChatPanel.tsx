
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, UserProfile, PromptDefinition } from '../../types';
import { Send, User, Sparkles, Loader2, Brain, UserCircle, Link as LinkIcon } from 'lucide-react';
import { sendChatFollowUp } from '../../services/geminiService';
import { saveChatSession, getChatSession } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

interface ChatPanelProps {
  prompt: PromptDefinition;
  userEmail: string | undefined;
  user: UserProfile | null;
  contentContext: string; // We need the content context for the AI to answer questions about it
}

// Function to generate dynamic system instruction based on the active tool
const getDynamicSystemInstruction = (prompt: PromptDefinition) => {
  return `SYSTEM INSTRUCTION & PERSONA DEFINITION:

You are NOT a generic AI assistant. You are strictly the "${prompt.title}" tool defined below.
Your entire behavior, tone, logic, and expertise must align with this specific role.

### ORIGINAL TOOL CONFIGURATION:
Title: ${prompt.title}
Description: ${prompt.description}
Core Directive (System Instruction):
"""
${prompt.systemInstruction}
"""

### YOUR TASK IN THIS CHAT:
The user has generated content using this tool. You are now assisting them in a follow-up conversation.
- If the tool is "Event Planner", you are an Event Planner.
- If the tool is "Lesson Planner", you are a Lesson Planner.
- If the tool is "Expert Consultant", you are that specific Consultant.

### GUIDELINES:
1. **Adhere to the Persona**: Do not break character. Use the terminology and expertise relevant to ${prompt.title}.
2. **Context**: The user's current generated content is provided. Use it as reference.
3. **Response Style**: Professional, helpful, and concise. Use standard text formatting (paragraphs, lists). Avoid Markdown code blocks unless requested.
4. **Subordination**: Your responses must be subordinate to the specific tool selected. Do not offer general advice outside this scope unless relevant to the specific task.`;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ prompt, userEmail, user, contentContext }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load History on Mount or Prompt Change
  useEffect(() => {
    if (userEmail && prompt.id) {
      setIsLoadingHistory(true);
      getChatSession(userEmail, prompt.id)
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
  }, [userEmail, prompt.id]);

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
    if (userEmail) saveChatSession(userEmail, prompt.id, updatedMessages);

    try {
      // Send to Gemini
      // We use the accumulated messages as history for context
      const response = await sendChatFollowUp(
        'gemini-2.5-flash',
        contentContext,
        updatedMessages.map(m => ({ role: m.role, text: m.text })),
        userMessage.text,
        getDynamicSystemInstruction(prompt) // Pass dynamic instruction
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        groundingMetadata: response.groundingMetadata
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Auto-save AI message to persistence layer
      if (userEmail) saveChatSession(userEmail, prompt.id, finalMessages);

    } catch (error) {
      console.error(error);
      addToast("Failed to get response from AI.", 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-slate-50">
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
            <h3 className="font-medium text-slate-900 mb-1">AI {prompt.title} Assistant</h3>
            <p className="text-sm max-w-xs mx-auto">
               I'm your dedicated {prompt.title}. How can I help you improve or expand your work?
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex max-w-[90%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden border bg-white shadow-sm
                  ${msg.role === 'user' ? 'border-blue-200' : 'border-slate-200'}`}>
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
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden flex flex-col
                  ${msg.role === 'user' 
                    ? 'bg-white border-2 border-blue-100 text-slate-800 rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                  
                  {/* Scrollable Content Container */}
                  <div className="max-h-96 overflow-y-auto custom-scrollbar break-words pr-2">
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                  </div>

                  {/* Sources / Citations for Model Messages */}
                  {msg.role === 'model' && msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                            <LinkIcon size={10} /> Sources found:
                        </p>
                        <ul className="space-y-1">
                            {msg.groundingMetadata.groundingChunks.map((chunk, idx) => (
                                chunk.web && (
                                    <li key={idx} className="text-[10px]">
                                        <a 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1.5 truncate max-w-[200px]"
                                        >
                                            <span className="w-3.5 h-3.5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold shrink-0 text-[9px]">{idx + 1}</span>
                                            {chunk.web.title}
                                        </a>
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                  )}

                  <div className={`text-[10px] mt-2 pt-2 border-t font-medium
                    ${msg.role === 'user' ? 'text-blue-400 border-blue-50' : 'text-slate-400 border-slate-50'}`}>
                    {msg.role === 'user' ? 'You' : `AI ${prompt.title}`} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 z-10 shadow-sm">
        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask your ${prompt.title}...`}
            className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm text-slate-800 placeholder-slate-400 shadow-inner"
            disabled={isSending}
            aria-label="Chat message input"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="absolute right-2 top-2.5 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
