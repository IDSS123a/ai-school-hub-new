import React, { useState, useEffect } from 'react';
import { PromptDefinition, NarrativeData, EvaluationData, UserProfile, ContentType } from '../types';
import { streamContent, generateNarrativeAssets, evaluatePedagogy } from '../services/geminiService';
import { saveGeneratedContent, saveTemplate } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import { Download, FileText, FileCode, MessageSquare, BarChart2, Image as ImageIcon, ChevronDown, FileType, File, Save } from 'lucide-react';
import { asBlob } from 'html-docx-js-typescript';

import FormPanel from './editor/FormPanel';
import PreviewPanel from './editor/PreviewPanel';
import ChatPanel from './editor/ChatPanel';

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
  const [activeView, setActiveView] = useState<'document' | 'narrative' | 'analytics' | 'chat'>('document');
  const [loadingExtras, setLoadingExtras] = useState(false);
  
  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Initialize form defaults
  useEffect(() => {
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
    setActiveView('document');
  }, [prompt, initialFormData, user]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setContent('');
    setNarrative(null);
    setEvaluation(null);
    setActiveView('document');
    
    let userPrompt = `Task: ${prompt.title}\n`;
    Object.entries(formData).forEach(([key, value]) => {
      const fieldLabel = prompt.fields.find(f => f.key === key)?.label || key;
      userPrompt += `${fieldLabel}: ${value}\n`;
    });

    let fullContent = '';

    try {
      addToast('Generating content...', 'info');
      await streamContent(
        'gemini-3-pro-preview', 
        prompt.systemInstruction,
        userPrompt,
        (chunk) => {
          setContent(prev => prev + chunk);
          fullContent += chunk;
        }
      );
      
      // Auto-save to Firebase if user is logged in
      if (user) {
        try {
          await saveGeneratedContent(user.email, {
             type: prompt.title as unknown as ContentType, 
             title: formData['topic'] || formData['event_name'] || prompt.title,
             content: fullContent,
             metadata: formData
          });
        } catch (e) {
          console.error("Failed to auto-save", e);
        }
      }

      // Generate extras
      generateExtras(fullContent);

    } catch (error) {
      console.error("Generation error:", error);
      addToast("Failed to generate content. Please try again.", 'error');
    } finally {
      setIsGenerating(false);
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
      setNarrative(narrativeResult);
      setEvaluation(evaluationResult);
    } catch (e) {
      console.error("Error generating extras:", e);
    } finally {
      setLoadingExtras(false);
    }
  };

  // --- SAVE TEMPLATE HANDLER ---
  const handleSaveTemplate = async (e?: React.FormEvent) => {
      if (e) e.preventDefault(); // Handle form submission
      
      if (!user) {
          addToast("Please login to save templates", "warning");
          return;
      }
      if (!templateName.trim()) {
          addToast("Please enter a template name", "warning");
          return;
      }

      // Confirmation Dialog (Double check)
      // We use a small timeout to let the UI update if triggered by keypress
      setTimeout(async () => {
        const confirmSave = window.confirm(`Are you sure you want to save this configuration as "${templateName}"?`);
        if (!confirmSave) {
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
            // Trigger event to update sidebar
            window.dispatchEvent(new Event('templateSaved'));
        } else {
            addToast("Failed to save template", "error");
        }
      }, 10);
  };

  const downloadFile = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
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
            const element = document.getElementById('document-preview-content');
            if (!element) return;
            const opt = {
                margin: [0.5, 0.5],
                filename: `${filename}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
            addToast("Downloading PDF...", "success");
        } else if (format === 'txt') {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = content.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
            const text = tempDiv.textContent || tempDiv.innerText || "";
            const blob = new Blob([text], { type: 'text/plain' });
            downloadFile(blob, `${filename}.txt`);
            addToast("Downloading Text file...", "success");
        } else if (format === 'md') {
            let md = content
              .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
              .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
              .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
              .replace(/<b>(.*?)<\/b>/gim, '**$1**')
              .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
              .replace(/<i>(.*?)<\/i>/gim, '*$1*')
              .replace(/<br\s*\/?>/gim, '\n')
              .replace(/<p>(.*?)<\/p>/gim, '$1\n\n')
              .replace(/<li>(.*?)<\/li>/gim, '- $1\n')
              .replace(/<ul>/gim, '')
              .replace(/<\/ul>/gim, '\n')
              .replace(/<[^>]*>/g, ''); 
             const blob = new Blob([md], { type: 'text/markdown' });
             downloadFile(blob, `${filename}.md`);
             addToast("Downloading Markdown...", "success");
        } else if (format === 'docx') {
             const htmlString = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${content}</body></html>`;
             const blob = await asBlob(htmlString);
             if (blob) {
                downloadFile(blob as Blob, `${filename}.docx`);
                addToast("Downloading DOCX...", "success");
             }
        } else if (format === 'html') {
             const blob = new Blob([content], { type: 'text/html' });
             downloadFile(blob, `${filename}.html`);
             addToast("Downloading HTML...", "success");
        }
      } catch (err) {
        console.error("Export error", err);
        addToast("Export failed. Please try again.", "error");
      }
      setShowExportMenu(false);
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Save Template Modal */}
      {showSaveTemplateModal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                  <h3 className="text-lg font-bold mb-4">Save Configuration</h3>
                  <p className="text-sm text-slate-500 mb-4">Save your current form inputs as a template to reuse later.</p>
                  <form onSubmit={handleSaveTemplate}>
                      <input 
                        type="text" 
                        placeholder="Template Name (e.g. 8th Grade History)" 
                        className="w-full p-3 border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-primary"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                          <button 
                            type="button" 
                            onClick={() => setShowSaveTemplateModal(false)} 
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
                          >
                            Save
                          </button>
                      </div>
                  </form>
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
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-2 flex items-center justify-between shadow-sm z-10">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
             <button 
               onClick={() => setActiveView('document')}
               className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                 ${activeView === 'document' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <FileText size={16} /> Document
             </button>
             <button 
               onClick={() => setActiveView('narrative')}
               className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                 ${activeView === 'narrative' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <ImageIcon size={16} /> Visuals
             </button>
             <button 
               onClick={() => setActiveView('analytics')}
               className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                 ${activeView === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <BarChart2 size={16} /> Analytics
             </button>
             <button 
               onClick={() => setActiveView('chat')}
               className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                 ${activeView === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <MessageSquare size={16} /> Chat
             </button>
          </div>
          
          <div className="relative">
            <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-blue-50 rounded-md transition-colors"
            >
                <Download size={16} /> Export <ChevronDown size={14}/>
            </button>
            {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                        <FileText size={16} className="text-red-500"/> PDF Document
                    </button>
                    <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                        <FileText size={16} className="text-blue-600"/> Word Document (.docx)
                    </button>
                    <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                        <FileCode size={16} className="text-orange-500"/> HTML File (.html)
                    </button>
                    <div className="h-px bg-slate-100 mx-4"></div>
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

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
           {activeView === 'chat' ? (
             <ChatPanel 
               promptId={prompt.id}
               userEmail={user?.email}
               user={user}
               contentContext={content}
             />
           ) : (
             <div className="h-full overflow-y-auto custom-scrollbar">
                <PreviewPanel 
                  activeView={activeView}
                  content={content}
                  narrative={narrative}
                  evaluation={evaluation}
                  loadingExtras={loadingExtras}
                  isGenerating={isGenerating}
                  prompt={prompt}
                  formData={formData}
                  onContentUpdate={(newContent) => setContent(newContent)}
                />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;