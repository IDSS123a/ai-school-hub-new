
import React, { useState, useEffect, useRef } from 'react';
import { PromptDefinition, NarrativeData, EvaluationData, UserProfile, ContentType, GroundingMetadata, Collaborator } from '../types';
import { streamContent, generateNarrativeAssets, evaluatePedagogy } from '../services/geminiService';
import { saveGeneratedContent, saveTemplate } from '../services/contentService';
import { CollaborationService } from '../services/collaborationService';
import { useToast } from '../context/ToastContext';
import { Download, FileText, FileCode, MessageSquare, BarChart2, Image as ImageIcon, ChevronDown, FileType, File, Save, Check, X, Printer, Users, Share2, RefreshCw, PenTool } from 'lucide-react';
import { asBlob } from 'html-docx-js-typescript';

import FormPanel from './editor/FormPanel';
import PreviewPanel from './editor/PreviewPanel';
import ChatPanel from './editor/ChatPanel';
import ShareModal from './ShareModal';

declare var html2pdf: any;

interface EditorLayoutProps {
  prompt: PromptDefinition;
  user: UserProfile | null;
  initialFormData?: Record<string, string>;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ prompt, user, initialFormData }) => {
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const [activeView, setActiveView] = useState<'document' | 'narrative' | 'analytics' | 'chat'>('document');
  const [loadingExtras, setLoadingExtras] = useState(false);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [typingCollaborator, setTypingCollaborator] = useState<string | null>(null);
  const [pendingRemoteContent, setPendingRemoteContent] = useState<string | null>(null);
  
  const collaborationService = useRef<CollaborationService | null>(null);
  const isMounted = useRef(false);
  const currentPromptId = useRef(prompt.id);
  const knownCollaboratorIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    isMounted.current = true;
    currentPromptId.current = prompt.id;

    const defaults: Record<string, string> = {};
    if (initialFormData) {
        setFormData(initialFormData);
    } else {
        prompt.fields.forEach(f => {
            if (f.defaultValue) defaults[f.key] = f.defaultValue;
        });
        setFormData(defaults);
    }
    
    setContent('');
    setNarrative(null);
    setEvaluation(null);
    setGroundingMetadata(null);
    setActiveView('document');
    setIsGenerating(false);
    setLoadingExtras(false);
    setPendingRemoteContent(null);
    setCollaborators([]);
    setTypingCollaborator(null);
    knownCollaboratorIds.current.clear();
    
    if (user) {
        collaborationService.current = new CollaborationService(prompt.id, user);
        knownCollaboratorIds.current.add(user.email);
        setCollaborators(collaborationService.current.getCollaborators());

        const unsubscribe = collaborationService.current.subscribe((event) => {
             if (event.type === 'presence_update') {
                 const newCollab = event.payload as Collaborator;
                 if (!knownCollaboratorIds.current.has(newCollab.userId)) {
                     knownCollaboratorIds.current.add(newCollab.userId);
                     addToast(`${newCollab.name} joined the session`, "info");
                 }
                 setCollaborators(collaborationService.current?.getCollaborators() || []);
             } else if (event.type === 'client_leave') {
                 const leavingUser = event.payload;
                 knownCollaboratorIds.current.delete(leavingUser.userId);
                 setCollaborators(collaborationService.current?.getCollaborators() || []);
             } else if (event.type === 'content_update') {
                 if (event.senderId !== user.email) {
                    if (!content) {
                        setContent(event.payload.content);
                    } else {
                        setPendingRemoteContent(event.payload.content);
                    }
                 }
             } else if (event.type === 'typing_start') {
                 if (event.senderId !== user.email) {
                    const collab = collaborationService.current?.getCollaborators().find(c => c.userId === event.senderId);
                    if (collab) setTypingCollaborator(`${collab.name} is typing...`);
                 }
             } else if (event.type === 'typing_end') {
                 if (event.senderId !== user.email) {
                    setTypingCollaborator(null);
                 }
             }
        });

        return () => {
             unsubscribe();
             collaborationService.current?.disconnect();
             collaborationService.current = null;
             isMounted.current = false;
        };
    } else {
        return () => { isMounted.current = false; };
    }
  }, [prompt, initialFormData, user]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleContentUpdate = (newContent: string) => {
      setContent(newContent);
      collaborationService.current?.sendContentUpdate(newContent);
  };
  
  const handleApplyRemoteChanges = () => {
      if (pendingRemoteContent) {
          setContent(pendingRemoteContent);
          setPendingRemoteContent(null);
          addToast("Remote changes applied", "success");
      }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setContent('');
    setNarrative(null);
    setEvaluation(null);
    setGroundingMetadata(null);
    setActiveView('document');
    setPendingRemoteContent(null);
    
    let userPrompt = `Task: ${prompt.title}\n`;
    Object.entries(formData).forEach(([key, value]) => {
      const fieldLabel = prompt.fields.find(f => f.key === key)?.label || key;
      userPrompt += `${fieldLabel}: ${value}\n`;
    });

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const userName = user?.name || "Educator";
    const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff Member";

    const masterFormattingInstruction = `
    IMPORTANT: You are generating a professional, enterprise-grade official document. 
    
    STRICT OUTPUT FORMATTING RULES:
    1. **RAW HTML ONLY**: Output pure, valid HTML code. 
    2. **NO MARKDOWN**: Do NOT include any introductory text or code blocks.
    3. **INLINE STYLING**: Use simple inline CSS.
    
    REQUIRED DOCUMENT STRUCTURE:
    <div style="font-family: sans-serif; max-width: 100%;">
        <div style="border-bottom: 2px solid #035EA1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between;">
             <div>
                <h1 style="margin: 0; font-size: 24px; color: #035EA1;">${prompt.title}</h1>
                <h2 style="margin: 5px 0 0; font-size: 16px; color: #08ABE6; font-weight: normal;">${prompt.description}</h2>
             </div>
             <div style="text-align: right; font-size: 12px; color: #4a5568;">
                <div><strong>Date:</strong> ${dateStr}</div>
                <div><strong>Created by:</strong> ${userName}</div>
                <div><strong>Role:</strong> ${userRole}</div>
             </div>
        </div>
        <div class="document-body">[GENERATE THE BODY CONTENT HERE]</div>
        <div style="margin-top: 60px; page-break-inside: avoid;">
            <div style="border-top: 1px solid #000; width: 250px; padding-top: 8px;">
                <p style="margin: 0; font-weight: bold;">Signature</p>
            </div>
            <div style="margin-top: 4px;">${userName}, ${userRole}</div>
        </div>
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #a0aec0;">
            Generated by AI School Hub | Enterprise Education Platform
        </div>
    </div>
    ---
    ${prompt.systemInstruction}
    `;

    let fullContent = '';
    try {
      addToast('Generating content...', 'info');
      await streamContent(
        'gemini-3-pro-preview', 
        masterFormattingInstruction, 
        userPrompt,
        (chunk) => {
          if (!isMounted.current || currentPromptId.current !== prompt.id) return;
          setContent(prev => prev + chunk);
          fullContent += chunk;
        },
        (metadata) => {
            if (!isMounted.current || currentPromptId.current !== prompt.id) return;
            setGroundingMetadata(metadata);
        }
      );
      
      if (!isMounted.current || currentPromptId.current !== prompt.id) return;
      collaborationService.current?.sendContentUpdate(fullContent);

      if (user) {
        saveGeneratedContent(user.email, {
             type: prompt.title as unknown as ContentType, 
             title: formData['topic'] || formData['event_name'] || prompt.title,
             content: fullContent,
             metadata: formData,
             groundingMetadata: groundingMetadata || undefined
          });
      }

      generateExtras(fullContent);

    } catch (error) {
      console.error("Generation error:", error);
      addToast("Failed to generate content.", 'error');
    } finally {
      if (isMounted.current && currentPromptId.current === prompt.id) {
        setIsGenerating(false);
      }
    }
  };

  const generateExtras = async (text: string) => {
    setLoadingExtras(true);
    try {
      const [narrativeResult, evaluationResult] = await Promise.all([
        generateNarrativeAssets(text),
        evaluatePedagogy(text)
      ]);
      if (isMounted.current && currentPromptId.current === prompt.id) {
        setNarrative(narrativeResult);
        setEvaluation(evaluationResult);
      }
    } catch (e) {
      console.error("Error generating extras:", e);
    } finally {
      if (isMounted.current && currentPromptId.current === prompt.id) {
        setLoadingExtras(false);
      }
    }
  };

  const handleSaveTemplate = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!user || !templateName.trim()) {
          addToast("Template name required", "warning");
          return;
      }
      const id = await saveTemplate(user.email, {
          userId: user.email,
          name: templateName,
          promptId: prompt.id,
          formData: formData
      });
      if (id) {
          addToast("Template saved successfully!", "success");
          setShowSaveTemplateModal(false);
          setTemplateName('');
          window.dispatchEvent(new Event('templateSaved'));
      }
  };

  const handleExport = async (format: 'pdf' | 'txt' | 'md' | 'docx' | 'html') => {
      if (!content) return;
      const filename = `${formData['topic'] || 'Document'}_${Date.now()}`;
      try {
        if (format === 'pdf') {
            const element = document.querySelector('.ql-editor') || document.getElementById('document-preview-content');
            if (!element) return;
            html2pdf().set({ margin: 0.5, filename: `${filename}.pdf` }).from(element).save();
        } else if (format === 'docx') {
             const htmlString = `<html><body>${content}</body></html>`;
             const blob = await asBlob(htmlString);
             if (blob) {
                 const url = URL.createObjectURL(blob as Blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `${filename}.docx`;
                 a.click();
             }
        } else {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${format}`;
            a.click();
        }
      } catch (err) {
        addToast("Export failed.", "error");
      }
      setShowExportMenu(false);
  };

  const getViewButtonClass = (viewName: string) => {
      const isActive = activeView === viewName;
      return `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border outline-none focus:ring-2 focus:ring-primary/40
        ${isActive ? 'bg-primary text-slate-900 border-primary shadow-sm' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`;
  };

  return (
    <div className="flex h-full overflow-hidden relative flex-col md:flex-row">
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title={prompt.title} user={user} />

      {showSaveTemplateModal && (
          <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-xl font-bold text-slate-900">Save as Template</h3>
                     <button onClick={() => setShowSaveTemplateModal(false)} aria-label="Close modal"><X size={20} /></button>
                  </div>
                  <div className="p-6">
                      <form onSubmit={handleSaveTemplate}>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-primary"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="e.g. Weekly History Plan"
                            autoFocus
                          />
                          <div className="flex justify-end gap-3">
                              <button type="button" onClick={() => setShowSaveTemplateModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                              <button type="submit" className="px-5 py-2.5 bg-primary text-slate-900 rounded-lg shadow-sm hover:shadow-md">Save Template</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      <FormPanel prompt={prompt} formData={formData} onInputChange={handleInputChange} onGenerate={handleGenerate} isGenerating={isGenerating} onSaveTemplate={() => setShowSaveTemplateModal(true)} />

      <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative">
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 flex-wrap gap-2">
          <div className="flex items-center gap-4">
             <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button onClick={() => setActiveView('document')} className={getViewButtonClass('document')} aria-label="View Document"><FileText size={16} /><span className="hidden sm:inline">Document</span></button>
                <button onClick={() => setActiveView('narrative')} className={getViewButtonClass('narrative')} aria-label="View Visuals"><ImageIcon size={16} /><span className="hidden sm:inline">Visuals</span></button>
                <button onClick={() => setActiveView('analytics')} className={getViewButtonClass('analytics')} aria-label="View Analytics"><BarChart2 size={16} /><span className="hidden sm:inline">Analytics</span></button>
                <button onClick={() => setActiveView('chat')} className={getViewButtonClass('chat')} aria-label="Open Chat"><MessageSquare size={16} /><span className="hidden sm:inline">Chat</span></button>
             </div>
             
             {collaborators.length > 0 && (
                <div className="hidden lg:flex items-center ml-2 border-l border-slate-200 pl-4 gap-3">
                    <div className="flex -space-x-2">
                         {collaborators.map((c, i) => (
                             <img key={i} src={c.picture} alt={c.name} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 object-cover" title={c.name} />
                         ))}
                    </div>
                    {typingCollaborator && (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium animate-pulse">
                            <PenTool size={12} />
                            <span>{typingCollaborator}</span>
                        </div>
                    )}
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-white border-secondary hover:bg-blue-600 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-secondary outline-none">
                <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
            </button>
            <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all outline-none focus:ring-2 focus:ring-primary/30">
                    <Download size={16} /> Export <ChevronDown size={14}/>
                </button>
                {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[110] animate-in slide-in-from-top-2">
                        <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"><FileText size={16} className="text-red-500"/> PDF Document</button>
                        <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"><FileText size={16} className="text-secondary"/> Word Document (.docx)</button>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
           {activeView === 'chat' ? (
             <ChatPanel prompt={prompt} userEmail={user?.email} user={user} contentContext={content} />
           ) : (
             <PreviewPanel activeView={activeView} content={content} narrative={narrative} evaluation={evaluation} groundingMetadata={groundingMetadata} loadingExtras={loadingExtras} isGenerating={isGenerating} prompt={prompt} formData={formData} onContentUpdate={handleContentUpdate} />
           )}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
