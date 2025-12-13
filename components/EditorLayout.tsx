
import React, { useState, useEffect, useRef } from 'react';
import { PromptDefinition, NarrativeData, EvaluationData, UserProfile, ContentType, GroundingMetadata, Collaborator } from '../types';
import { streamContent, generateNarrativeAssets, evaluatePedagogy } from '../services/geminiService';
import { saveGeneratedContent, saveTemplate } from '../services/contentService';
import { CollaborationService } from '../services/collaborationService';
import { useToast } from '../context/ToastContext';
import { Download, FileText, FileCode, MessageSquare, BarChart2, Image as ImageIcon, ChevronDown, FileType, File, Save, Check, X, Printer, Users, Share2, RefreshCw } from 'lucide-react';
import { asBlob } from 'html-docx-js-typescript';

import FormPanel from './editor/FormPanel';
import PreviewPanel from './editor/PreviewPanel';
import ChatPanel from './editor/ChatPanel';
import ShareModal from './ShareModal';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface EditorLayoutProps {
  prompt: PromptDefinition;
  user: UserProfile | null;
  initialFormData?: Record<string, string>;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({ prompt, user, initialFormData }) => {
  const { addToast } = useToast();
  
  // State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null);
  const [activeView, setActiveView] = useState<'document' | 'narrative' | 'analytics' | 'chat'>('document');
  const [loadingExtras, setLoadingExtras] = useState(false);
  
  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  
  // Collaboration State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingRemoteContent, setPendingRemoteContent] = useState<string | null>(null);
  const collaborationService = useRef<CollaborationService | null>(null);
  
  // Track known collaborators to avoid duplicate toast notifications
  const knownCollaboratorIds = useRef<Set<string>>(new Set());

  // Refs to handle component mounting status
  const isMounted = useRef(false);
  const currentPromptId = useRef(prompt.id);

  // Initialize form defaults and handle prompt switching
  useEffect(() => {
    isMounted.current = true;
    currentPromptId.current = prompt.id;

    // Reset State completely on prompt change
    const defaults: Record<string, string> = {};
    if (initialFormData) {
        setFormData(initialFormData);
    } else {
        prompt.fields.forEach(f => {
            if (f.defaultValue) defaults[f.key] = f.defaultValue;
        });
        setFormData(defaults);
    }
    
    // Reset View
    setContent('');
    setNarrative(null);
    setEvaluation(null);
    setGroundingMetadata(null);
    setActiveView('document');
    setIsGenerating(false);
    setLoadingExtras(false);
    setPendingRemoteContent(null);
    setCollaborators([]);
    knownCollaboratorIds.current.clear();
    
    // Initialize Collaboration Service
    if (user) {
        collaborationService.current = new CollaborationService(prompt.id, user);
        
        // Add self to known list so we don't toast ourselves
        knownCollaboratorIds.current.add(user.email);
        
        // Update collaborators list locally
        setCollaborators(collaborationService.current.getCollaborators());

        const unsubscribe = collaborationService.current.subscribe((event) => {
             if (event.type === 'presence_update') {
                 const newCollab = event.payload as Collaborator;
                 if (!knownCollaboratorIds.current.has(newCollab.userId)) {
                     knownCollaboratorIds.current.add(newCollab.userId);
                     addToast(`${newCollab.name} joined the session`, "info");
                 }
                 
                 if (collaborationService.current) {
                    setCollaborators(collaborationService.current.getCollaborators());
                 }
             } else if (event.type === 'client_leave') {
                 const leavingUser = event.payload;
                 knownCollaboratorIds.current.delete(leavingUser.userId);
                 addToast(`${leavingUser.name} left the session`, "info");
                 
                 if (collaborationService.current) {
                    setCollaborators(collaborationService.current.getCollaborators());
                 }
             } else if (event.type === 'content_update') {
                 // Improved Collaboration Logic:
                 // If the user is viewing and not typing, we could auto-update.
                 // But to be safe, we show a confirmation if content exists.
                 if (event.senderId !== user.email) {
                    if (!content) {
                        setContent(event.payload.content);
                    } else {
                        setPendingRemoteContent(event.payload.content);
                    }
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
      // Broadcast change to other tabs
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

    // --- ENTERPRISE FORMATTING INJECTION ---
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const userName = user?.name || "Educator";
    const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Staff Member";

    const masterFormattingInstruction = `
    
    IMPORTANT: You are generating a professional, enterprise-grade official document. 
    
    STRICT OUTPUT FORMATTING RULES:
    1. **RAW HTML ONLY**: Output pure, valid HTML code. 
    2. **NO MARKDOWN**: Do NOT use markdown code blocks (e.g. \`\`\`html ... \`\`\`). Do NOT include any introductory text. Start directly with the HTML tags.
    3. **INLINE STYLING**: Use simple inline CSS for essential layout (tables, alignment) to ensure it renders correctly in basic editors.
    
    REQUIRED DOCUMENT STRUCTURE:
    
    <div style="font-family: sans-serif; max-width: 100%;">
        <!-- HEADER -->
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

        <!-- BODY CONTENT -->
        <div class="document-body">
            <!-- 
               INSTRUCTION: 
               - Use <h3> for Section Headings (color: #035EA1).
               - Use <table border="1" style="border-collapse: collapse; width: 100%; margin: 15px 0;"> for structured data.
               - Use <ul>/<ol> for lists.
               - Use <p style="margin-bottom: 12px; line-height: 1.6;"> for paragraphs.
               - Use <b> and <i> for emphasis.
            -->
            [GENERATE THE BODY CONTENT HERE BASED ON THE TOOL INSTRUCTIONS]
        </div>

        <!-- SIGNATURE SECTION -->
        <div style="margin-top: 60px; page-break-inside: avoid;">
            <div style="border-top: 1px solid #000; width: 250px; padding-top: 8px;">
                <p style="margin: 0; font-weight: bold;">Signature</p>
            </div>
            <div style="margin-top: 4px;">
                ${userName}, ${userRole}
            </div>
        </div>

        <!-- FOOTER -->
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #a0aec0;">
            Generated by AI School Hub | Enterprise Education Platform
        </div>
    </div>

    Combine the specific tool instructions below with this strict HTML structure.
    ---
    ${prompt.systemInstruction}
    `;

    let fullContent = '';

    try {
      addToast('Generating content with Google Search...', 'info');
      await streamContent(
        'gemini-3-pro-preview', 
        masterFormattingInstruction, 
        userPrompt,
        (chunk) => {
          if (!isMounted.current || currentPromptId.current !== prompt.id) return;
          setContent(prev => {
             const newVal = prev + chunk;
             return newVal;
          });
          fullContent += chunk;
        },
        (metadata) => {
            if (!isMounted.current || currentPromptId.current !== prompt.id) return;
            setGroundingMetadata(metadata);
        }
      );
      
      if (!isMounted.current || currentPromptId.current !== prompt.id) return;

      // Broadcast final generated content
      collaborationService.current?.sendContentUpdate(fullContent);

      // Auto-save to Firebase if user is logged in
      if (user) {
        try {
          await saveGeneratedContent(user.email, {
             type: prompt.title as unknown as ContentType, 
             title: formData['topic'] || formData['event_name'] || prompt.title,
             content: fullContent,
             metadata: formData,
             groundingMetadata: groundingMetadata || undefined
          });
        } catch (e) {
          console.error("Failed to auto-save", e);
        }
      }

      // Generate extras
      generateExtras(fullContent);

    } catch (error) {
      if (!isMounted.current || currentPromptId.current !== prompt.id) return;
      console.error("Generation error:", error);
      addToast("Failed to generate content. Please try again.", 'error');
    } finally {
      if (isMounted.current && currentPromptId.current === prompt.id) {
        setIsGenerating(false);
      }
    }
  };

  const generateExtras = async (text: string) => {
    setLoadingExtras(true);
    try {
      // Parallel execution for efficiency
      const [narrativeResult, evaluationResult] = await Promise.all([
        generateNarrativeAssets(text),
        evaluatePedagogy(text)
      ]);
      
      if (!isMounted.current || currentPromptId.current !== prompt.id) return;
      
      setNarrative(narrativeResult);
      setEvaluation(evaluationResult);
    } catch (e) {
      console.error("Error generating extras:", e);
    } finally {
      if (isMounted.current && currentPromptId.current === prompt.id) {
        setLoadingExtras(false);
      }
    }
  };

  // --- SAVE TEMPLATE HANDLER ---
  const handleSaveTemplate = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      if (!user) {
          addToast("Please login to save templates", "warning");
          return;
      }
      if (!templateName.trim()) {
          addToast("Please enter a template name", "warning");
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
      } else {
          addToast("Failed to save template", "error");
      }
  };

  const downloadFile = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!content) {
        addToast("No content to print", "warning");
        return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${formData['topic'] || 'Document'} - Print</title>
              <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
              <style>
                body { 
                    font-family: 'Poppins', sans-serif; 
                    padding: 40px; 
                    max-width: 800px; 
                    margin: 0 auto;
                    line-height: 1.6;
                    color: #1a202c;
                }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: 600; }
                h1 { font-size: 24pt; margin-bottom: 0.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-weight: 700; text-align: center; }
                h2 { font-size: 18pt; margin-top: 0.5em; margin-bottom: 1em; color: #475569; font-weight: 500; text-align: center; }
                h3 { font-size: 14pt; margin-top: 1.5em; margin-bottom: 0.5em; color: #2563eb; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;}
                p { margin-bottom: 10pt; text-align: justify; }
              </style>
            </head>
            <body>
              ${content}
              <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
    }
  };

  // --- EXPORT HANDLERS ---
  const handleExport = async (format: 'pdf' | 'txt' | 'md' | 'docx' | 'html') => {
      if (!content) {
          addToast("No content to export", "warning");
          return;
      }

      const filename = `${formData['topic'] || 'Document'}_${Date.now()}`;

      try {
        if (format === 'pdf') {
            const element = document.querySelector('.ql-editor') || document.getElementById('document-preview-content');
            if (!element) { addToast("Could not find document content", "error"); return; }
            const opt = {
                margin: [0.5, 0.5],
                filename: `${filename}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            html2pdf().set(opt).from(element).save();
            addToast("Downloading PDF...", "success");
        } else if (format === 'txt') {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
            const blob = new Blob([tempDiv.innerText], { type: 'text/plain' });
            downloadFile(blob, `${filename}.txt`);
        } else if (format === 'md') {
             // Basic MD conversion
             const blob = new Blob([content.replace(/<[^>]*>/g, '')], { type: 'text/markdown' });
             downloadFile(blob, `${filename}.md`);
        } else if (format === 'docx') {
             // Add robust HTML wrapper for docx converter
             const htmlString = `
                <!DOCTYPE html>
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
                <head>
                    <meta charset="utf-8">
                    <title>${filename}</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 11pt; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
                        td, th { border: 1px solid #000; padding: 5px; }
                        h1 { font-size: 16pt; font-weight: bold; }
                        h2 { font-size: 14pt; font-weight: bold; color: #555; }
                        h3 { font-size: 12pt; font-weight: bold; color: #2563eb; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>`;
             const blob = await asBlob(htmlString);
             if (blob) downloadFile(blob as Blob, `${filename}.docx`);
             addToast("Downloading DOCX...", "success");
        } else if (format === 'html') {
             const blob = new Blob([content], { type: 'text/html' });
             downloadFile(blob, `${filename}.html`);
        }
      } catch (err) {
        console.error("Export error", err);
        addToast("Export failed. Please try again.", "error");
      }
      setShowExportMenu(false);
  };

  // Helper for view switcher button classes
  const getViewButtonClass = (viewName: string) => {
      const isActive = activeView === viewName;
      return `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border
        ${isActive 
            ? 'bg-primary text-slate-900 border-primary shadow-sm ring-2 ring-primary/20' 
            : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`;
  };

  return (
    <div className="flex h-full overflow-hidden relative flex-col md:flex-row">
      
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={prompt.title}
        user={user}
      />

      {showSaveTemplateModal && (
          <div 
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-template-title"
          >
              <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                     <h3 id="save-template-title" className="text-xl font-bold text-slate-900">Save Configuration</h3>
                     <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary rounded">
                       <X size={20} />
                     </button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-slate-500 mb-4">
                        Save your current inputs as a reusable template. You can access this later from the sidebar or settings.
                      </p>
                      <form onSubmit={handleSaveTemplate}>
                          <label htmlFor="templateNameInput" className="block text-sm font-semibold text-slate-700 mb-2">Template Name</label>
                          <input 
                            id="templateNameInput"
                            type="text" 
                            className="w-full p-3 border border-slate-300 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            placeholder="e.g. History 8th Grade Format"
                            autoFocus
                            required
                          />
                          <div className="flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setShowSaveTemplateModal(false)} 
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-slate-200"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="px-5 py-2.5 bg-primary text-slate-900 rounded-lg hover:bg-amber-400 font-medium transition-transform active:scale-95 shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                              >
                                Confirm Save
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Left Panel - Form */}
      <FormPanel 
        prompt={prompt} 
        formData={formData} 
        onInputChange={handleInputChange} 
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        onSaveTemplate={() => setShowSaveTemplateModal(true)}
      />

      {/* Right Panel - Output */}
      <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative">
        {/* Collaboration Sync Bar */}
        {pendingRemoteContent && (
            <div className="bg-secondary text-white px-4 py-2 flex items-center justify-between text-sm shadow-md animate-in slide-in-from-top-2 z-20">
                <div className="flex items-center gap-2">
                    <RefreshCw className="animate-spin-slow" size={16} />
                    <span>Remote changes detected from collaborator.</span>
                </div>
                <button 
                    onClick={handleApplyRemoteChanges}
                    className="bg-white text-secondary px-3 py-1 rounded font-bold hover:bg-blue-50 transition-colors"
                >
                    Sync Now
                </button>
            </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 flex-wrap gap-2">
          
          <div className="flex items-center gap-4">
             {/* View Switcher */}
             <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveView('document')} className={getViewButtonClass('document')}>
                  <FileText size={16} /> <span className="hidden sm:inline">Document</span>
                </button>
                <button onClick={() => setActiveView('narrative')} className={getViewButtonClass('narrative')}>
                  <ImageIcon size={16} /> <span className="hidden sm:inline">Visuals</span>
                </button>
                <button onClick={() => setActiveView('analytics')} className={getViewButtonClass('analytics')}>
                  <BarChart2 size={16} /> <span className="hidden sm:inline">Analytics</span>
                </button>
                <button onClick={() => setActiveView('chat')} className={getViewButtonClass('chat')}>
                  <MessageSquare size={16} /> <span className="hidden sm:inline">Chat</span>
                </button>
             </div>
             
             {/* Active Collaborators */}
             {collaborators.length > 0 && (
                <div className="hidden lg:flex items-center ml-2 border-l border-slate-200 pl-4 gap-2">
                    <div className="flex -space-x-2">
                         {collaborators.map((c, i) => (
                             <div key={i} className="relative group/collab cursor-pointer">
                                 <img 
                                   src={c.picture} 
                                   alt={c.name} 
                                   className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-slate-100 object-cover" 
                                 />
                                 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/collab:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-50">
                                     {c.name}
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
             )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowShareModal(true)} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border bg-secondary text-white border-secondary hover:bg-blue-600 shadow-sm hover:shadow hover:scale-[1.02] active:scale-95 duration-200"
            >
                <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
            </button>

            {/* Expanded Export Menu */}
            <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border hover:scale-[1.02] active:scale-95 duration-200 ${showExportMenu ? 'bg-secondary/10 text-secondary border-secondary/30' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    <Download size={16} /> Export <ChevronDown size={14}/>
                </button>
                {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                        <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                            <FileText size={16} className="text-red-500"/> PDF Document
                        </button>
                        <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                            <FileText size={16} className="text-secondary"/> Word Document (.docx)
                        </button>
                        <button onClick={handlePrint} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 border-t border-slate-100">
                            <Printer size={16} className="text-slate-800"/> Print Document
                        </button>
                        <div className="h-px bg-slate-100 mx-4"></div>
                        <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                            <FileCode size={16} className="text-amber-500"/> HTML File (.html)
                        </button>
                        <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                            <FileType size={16} className="text-slate-500"/> Plain Text (.txt)
                        </button>
                        <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                            <File size={16} className="text-slate-900"/> Markdown (.md)
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
           {activeView === 'chat' ? (
             <ChatPanel 
               prompt={prompt}
               userEmail={user?.email}
               user={user}
               contentContext={content}
             />
           ) : (
             <div className="h-full w-full overflow-hidden">
                <PreviewPanel 
                  activeView={activeView}
                  content={content}
                  narrative={narrative}
                  evaluation={evaluation}
                  groundingMetadata={groundingMetadata}
                  loadingExtras={loadingExtras}
                  isGenerating={isGenerating}
                  prompt={prompt}
                  formData={formData}
                  onContentUpdate={handleContentUpdate}
                />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
