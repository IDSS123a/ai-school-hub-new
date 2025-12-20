
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, UserProfile, PromptDefinition } from '../../types';
import { Send, User, Sparkles, Loader2, Brain, UserCircle, Link as LinkIcon, Paperclip, X as CloseIcon, FileText as FileIcon } from 'lucide-react';
import { sendChatFollowUp } from '../../services/geminiService';
import { saveChatSession, getChatSession } from '../../services/contentService';
import { useToast } from '../../context/ToastContext';

interface ChatPanelProps {
  prompt: PromptDefinition;
  userEmail: string | undefined;
  user: UserProfile | null;
  contentContext: string;
}

const getDynamicSystemInstruction = (prompt: PromptDefinition) => {
  return `SYSTEM INSTRUCTION & PERSONA DEFINITION:
You are strictly the "${prompt.title}" tool. Your behavior, tone, and logic must align with this specific role.

### YOUR TASK:
Assisting in a follow-up conversation about generated educational content.
If the user uploads a file, use it as grounding context for your answers.
Professional, helpful, and concise.`;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ prompt, userEmail, user, contentContext }) => {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userEmail && prompt.id) {
      setIsLoadingHistory(true);
      getChatSession(userEmail, prompt.id)
        .then((msgs) => setMessages(msgs || []))
        .catch(console.error)
        .finally(() => setIsLoadingHistory(false));
    } else {
        setMessages([]);
    }
  }, [userEmail, prompt.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("File too large. Max 5MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachedFile({
        name: file.name,
        data: base64Data,
        mimeType: file.type || 'application/octet-stream'
      });
      addToast(`Attached ${file.name}`, "info");
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input || (attachedFile ? `[Attached File: ${attachedFile.name}]` : ''),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);

    const currentFile = attachedFile;
    setAttachedFile(null);

    if (userEmail) saveChatSession(userEmail, prompt.id, updatedMessages);

    try {
      const response = await sendChatFollowUp(
        'gemini-3-flash-preview',
        contentContext,
        updatedMessages.map(m => ({ role: m.role, text: m.text })),
        userMessage.text,
        getDynamicSystemInstruction(prompt),
        currentFile ? { data: currentFile.data, mimeType: currentFile.mimeType } : undefined
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
      
      if (userEmail) saveChatSession(userEmail, prompt.id, finalMessages);

    } catch (error) {
      console.error(error);
      addToast("Failed to get response from AI.", 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative" role="region" aria-label={`Chat with AI ${prompt.title}`}>
      {/* Chat History */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-8 bg-slate-50"
        aria-live="polite"
        role="log"
      >
        {isLoadingHistory && (
            <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-slate-400" aria-label="Loading chat history" />
            </div>
        )}
        
        {!isLoadingHistory && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-slate-100 relative">
              <img src="https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png" alt="" className="w-10 h-10 object-contain relative z-10" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">AI {prompt.title} Assistant</h3>
            <p className="text-sm max-w-xs mx-auto text-slate-500">
               Ask questions about the generated content or upload files for more context.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex max-w-[90%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden border bg-white shadow-sm ${msg.role === 'user' ? 'border-blue-200' : 'border-slate-200'}`}>
                  <img src={msg.role === 'user' ? (user?.picture || "https://ui-avatars.com/api/?name=User") : "https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png"} alt={msg.role === 'user' ? "You" : "AI"} className="w-full h-full object-cover" />
                </div>
                
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden flex flex-col ${msg.role === 'user' ? 'bg-white border-2 border-blue-100 text-slate-800 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar break-words pr-2">
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                  </div>

                  <div className={`text-[10px] mt-2 pt-2 border-t font-medium ${msg.role === 'user' ? 'text-blue-400 border-blue-50' : 'text-slate-400 border-slate-50'}`}>
                    {msg.role === 'user' ? 'You' : `AI ${prompt.title}`} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isSending && (
          <div className="flex w-full justify-start animate-in fade-in duration-300">
            <div className="flex max-w-[80%] gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                <Brain size={18} className="text-primary animate-pulse" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Thinking...</span>
                 </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0 z-10 shadow-sm">
        {attachedFile && (
            <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg animate-in slide-in-from-bottom-2">
                <FileIcon size={16} className="text-primary" />
                <span className="text-xs font-medium text-slate-700 truncate flex-1">{attachedFile.name}</span>
                <button 
                  onClick={() => setAttachedFile(null)} 
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 focus-visible:ring-2 focus-visible:ring-primary outline-none transition-all"
                  aria-label={`Remove file ${attachedFile.name}`}
                >
                    <CloseIcon size={14} />
                </button>
            </div>
        )}

        <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.txt,.doc,.docx,image/*"
            aria-hidden="true"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-inner focus-visible:ring-2 focus-visible:ring-primary outline-none hover:scale-105 active:scale-95"
            aria-label="Attach context file (PDF, TXT, or Image)"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask your ${prompt.title}...`}
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm text-slate-800 placeholder-slate-400 shadow-inner"
              disabled={isSending}
              aria-label="Message text"
            />
            <button 
              type="submit"
              disabled={(!input.trim() && !attachedFile) || isSending}
              className="absolute right-2 top-2.5 p-2 bg-primary text-slate-900 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary outline-none hover:scale-105 active:scale-95"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-400" id="chat-hint">AI supports PDF, text and images as additional context.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
