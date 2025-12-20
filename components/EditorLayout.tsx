
import React, { useState, useEffect, useRef } from 'react';
import { PromptDefinition, NarrativeData, EvaluationData, UserProfile, ContentType, GroundingMetadata, Collaborator, SavedTemplate } from '../types';
import { streamContent, generateNarrativeAssets, evaluatePedagogy } from '../services/geminiService';
import { saveGeneratedContent, saveTemplate } from '../services/contentService';
import { CollaborationService } from '../services/collaborationService';
import { useToast } from '../context/ToastContext';
import { Download, FileText, FileCode, MessageSquare, BarChart2, Image as ImageIcon, ChevronDown, FileType, File, Save, Check, X, Printer, Users, Share2, RefreshCw, PenTool, AlertCircle } from 'lucide-react';
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
  activeTemplate?: SavedTemplate | null;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ prompt, user, initialFormData, activeTemplate }) => {
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
  const [isTemplateModified, setIsTemplateModified] = useState(false);
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [typingCollaborator, setTypingCollaborator] = useState<string | null>(null);
  const [pendingRemoteContent, setPendingRemoteContent] = useState<string | null>(null);
  
  const collaborationService = useRef<CollaborationService | null>(null);
  const isMounted = useRef(false);
  const currentPromptId = useRef(prompt.id);

  useEffect(() => {
    isMounted.current = true;
    currentPromptId.current = prompt.id;

    const defaults: Record<string, string> = {};
    if (initialFormData) {
        setFormData(initialFormData);
        setIsTemplateModified(false);
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
    
    if (user) {
        collaborationService.current = new CollaborationService(prompt.id, user);
        setCollaborators(collaborationService.current.getCollaborators());

        const unsubscribe = collaborationService.current.subscribe((event) => {
             if (event.type === 'presence_update') {
                 setCollaborators(collaborationService.current?.getCollaborators() || []);
             } else if (event.type === 'client_leave') {
                 setCollaborators(collaborationService.current?.getCollaborators() || []);
             } else if (event.type === 'content_update') {
                 if (event.senderId !== user.email) {
                    setPendingRemoteContent(event.payload.content);
                 }
             } else if (event.type === 'typing_start') {
                 if (event.senderId !== user.email) {
                    const collab = collaborationService.current?.getCollaborators().find(c => c.userId === event.senderId);
                    if (collab) setTypingCollaborator(`${collab.name} is typing...`);
                 }
             } else if (event.type === 'typing_end') {
                 if (event.senderId !== user.email) setTypingCollaborator(null);
             }
        });

        return () => {
             unsubscribe();
             collaborationService.current?.disconnect();
             collaborationService.current = null;
             isMounted.current = false;
        };
    }
  }, [prompt, initialFormData, user]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => {
        const next = { ...prev, [key]: value };
        if (activeTemplate) {
            setIsTemplateModified(JSON.stringify(next) !== JSON.stringify(activeTemplate.formData));
        }
        return next;
    });
  };

  const handleContentUpdate = (newContent: string) => {
      setContent(newContent);
      collaborationService.current?.sendContentUpdate(newContent);
  };

  const handleApplyRemoteChanges = () => {
    if (pendingRemoteContent) {
        setContent(pendingRemoteContent);
        setPendingRemoteContent(null);
        addToast("Document synced with collaborator's changes.", "success");
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setContent('');
    setActiveView('document');
    
    let userPrompt = `Task: ${prompt.title}\n`;
    Object.entries(formData).forEach(([key, value]) => {
      const fieldLabel = prompt.fields.find(f => f.key === key)?.label || key;
      userPrompt += `${fieldLabel}: ${value}\n`;
    });

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const masterFormattingInstruction = `
    You are an enterprise document architect. Generate strictly valid HTML following this structure:
    1. Header: Use a <div> with a border-bottom, containing an <h1> for the Title, and a right-aligned block with 'Created on: ${dateStr}' and 'Educator: ${user?.name || 'Educator'}'.
    2. Body: Use <h3> for section titles, <p> for body text, <ul>/<li> for lists, and <table> for structured data where appropriate. Use <strong> and <em> for emphasis.
    3. Signature: A <div> at the end with a horizontal line and 'Signature: ____________________'.
    4. Footer: A centered <footer> with 'Confidential - AI School Hub Enterprise Edition'.
    DO NOT output Markdown. ONLY pure, high-quality HTML.
    `;

    try {
      addToast('Generating enterprise content...', 'info');
      await streamContent(
        'gemini-3-pro-preview', 
        masterFormattingInstruction, 
        userPrompt,
        (chunk) => {
          if (!isMounted.current) return;
          setContent(prev => prev + chunk);
        },
        (metadata) => {
            if (!isMounted.current) return;
            setGroundingMetadata(metadata);
        }
      );
      
      if (user) {
        saveGeneratedContent(user.email, {
             type: prompt.title as unknown as ContentType, 
             title: formData['topic'] || prompt.title,
             content: content,
             metadata: formData,
             groundingMetadata: groundingMetadata || undefined
          });
      }
      generateExtras(content);
    } catch (error) {
      addToast("Failed to generate content.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExtras = async (text: string) => {
    setLoadingExtras(true);
    try {
      const [narrativeResult, evaluationResult] = await Promise.all([
        generateNarrativeAssets(text),
        evaluatePedagogy(text)
      ]);
      if (isMounted.current) {
        setNarrative(narrativeResult);
        setEvaluation(evaluationResult);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExtras(false);
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
          setIsTemplateModified(false);
          window.dispatchEvent(new Event('templateSaved'));
      }
  };

  const handleUpdateTemplate = async () => {
      if (!user || !activeTemplate) return;
      if (!window.confirm(`Save changes to template "${activeTemplate.name}"?`)) return;

      const id = await saveTemplate(user.email, {
          userId: user.email,
          name: activeTemplate.name,
          promptId: prompt.id,
          formData: formData
      });
      
      if (id) {
          addToast("Template updated!", "success");
          setIsTemplateModified(false);
          window.dispatchEvent(new Event('templateSaved'));
      }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
      if (!content) return;
      const filename = `${formData['topic'] || 'Document'}_${Date.now()}`;
      try {
        if (format === 'pdf') {
            const element = document.querySelector('.ql-editor') || document.getElementById('document-preview-content');
            if (!element) return;
            const opt = {
              margin: [10, 10, 10, 10],
              filename: `${filename}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
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
            a.download = `${filename}.txt`;
            a.click();
        }
      } catch (err) {
        addToast("Export failed.", "error");
      }
      setShowExportMenu(false);
  };

  const getViewButtonClass = (viewName: string) => {
      const isActive = activeView === viewName;
      return `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border outline-none focus:ring-2 focus:ring-primary/40 hover:scale-105 active:scale-95
        ${isActive ? 'bg-primary text-slate-900 border-primary shadow-sm' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`;
  };

  return (
    <div className="flex h-full overflow-hidden relative flex-col md:flex-row">
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title={prompt.title} user={user} />

      {/* Template Confirmation Modal */}
      {showSaveTemplateModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="text-xl font-bold text-slate-900">New Template</h3>
                     <button onClick={() => setShowSaveTemplateModal(false)} aria-label="Cancel"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-500">Provide a name to save this configuration for future planning sessions.</p>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Template Title</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-primary shadow-inner"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="e.g. Science Week 12 Planner"
                            autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setShowSaveTemplateModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
                          <button onClick={handleSaveTemplate} className="px-5 py-2.5 bg-primary text-slate-900 font-bold rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all">Save Template</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <FormPanel prompt={prompt} formData={formData} onInputChange={handleInputChange} onGenerate={handleGenerate} isGenerating={isGenerating} onSaveTemplate={() => setShowSaveTemplateModal(true)} />

      <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative">
        {/* Remote Update Notification */}
        {pendingRemoteContent && (
            <div className="bg-primary/90 backdrop-blur text-slate-900 p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-full duration-300 z-50">
                <div className="flex items-center gap-3 font-medium">
                    <AlertCircle size={20} />
                    <span>A collaborator has updated the document. Apply changes?</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPendingRemoteContent(null)} className="px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/40 rounded-lg transition-colors">Ignore</button>
                    <button onClick={handleApplyRemoteChanges} className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1">
                        <Check size={14} /> Sync Now
                    </button>
                </div>
            </div>
        )}

        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 flex-wrap gap-2">
          <div className="flex items-center gap-4">
             <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button onClick={() => setActiveView('document')} className={getViewButtonClass('document')} aria-label="View Document"><FileText size={16} /><span className="hidden sm:inline">Document</span></button>
                <button onClick={() => setActiveView('narrative')} className={getViewButtonClass('narrative')} aria-label="View Narratives"><ImageIcon size={16} /><span className="hidden sm:inline">Visuals</span></button>
                <button onClick={() => setActiveView('analytics')} className={getViewButtonClass('analytics')} aria-label="View Analytics"><BarChart2 size={16} /><span className="hidden sm:inline">Analytics</span></button>
                <button onClick={() => setActiveView('chat')} className={getViewButtonClass('chat')} aria-label="Open AI Assistant"><MessageSquare size={16} /><span className="hidden sm:inline">Chat</span></button>
             </div>
             
             {collaborators.length > 0 && (
                <div className="hidden lg:flex items-center ml-2 border-l border-slate-200 pl-4 gap-3">
                    <div className="flex -space-x-2">
                         {collaborators.map((c, i) => (
                             <img key={i} src={c.picture} alt={c.name} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 object-cover" title={c.name} />
                         ))}
                    </div>
                    {typingCollaborator && (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold animate-pulse">
                            <PenTool size={12} /> {typingCollaborator}
                        </div>
                    )}
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            {isTemplateModified && activeTemplate && (
                <button onClick={handleUpdateTemplate} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm transition-all hover:scale-105 active:scale-95">
                    <Save size={16} /> <span className="hidden sm:inline">Update Template</span>
                </button>
            )}
            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-white hover:bg-blue-600 shadow-sm transition-all hover:scale-105 active:scale-95">
                <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
            </button>
            <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleExport('pdf')} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all hover:scale-105 active:scale-95"
                  title="Direct PDF Export"
                >
                    <Printer size={16} /> <span className="hidden sm:inline">PDF</span>
                </button>
                <div className="relative">
                    <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                        <Download size={16} /> Export <ChevronDown size={14}/>
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[110] animate-in slide-in-from-top-2">
                            <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">PDF Document</button>
                            <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">Word (.docx)</button>
                            <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">Plain Text (.txt)</button>
                        </div>
                    )}
                </div>
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
