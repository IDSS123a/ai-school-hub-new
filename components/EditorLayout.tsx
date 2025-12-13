import React, { useState, useEffect } from 'react';
import { PromptDefinition, NarrativeData, EvaluationData, UserProfile, ContentType } from '../types';
import { streamContent, generateNarrativeAssets, evaluatePedagogy } from '../services/geminiService';
import { saveGeneratedContent, saveTemplate } from '../services/contentService';
import { useToast } from '../context/ToastContext';
import { Download, FileText, FileCode, MessageSquare, BarChart2, Image as ImageIcon, ChevronDown, FileType, File, Save, Check, X, Printer } from 'lucide-react';
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
      if (e) e.preventDefault();
      
      if (!user) {
          addToast("Please login to save templates", "warning");
          return;
      }
      if (!templateName.trim()) {
          addToast("Please enter a template name", "warning");
          return;
      }

      // NO window.confirm here. The Modal serves as the robust confirmation.
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
        // We inject the Poppins font to ensure consistency with the UI
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
                h1 { font-size: 24pt; margin-bottom: 0.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-weight: 700; }
                h2 { font-size: 18pt; margin-top: 1.5em; margin-bottom: 0.5em; color: #2d3748; font-weight: 600; }
                h3 { font-size: 14pt; margin-top: 1.2em; margin-bottom: 0.5em; color: #4a5568; font-weight: 600; }
                p { margin-bottom: 1em; text-align: justify; }
                ul, ol { margin-bottom: 1em; padding-left: 20px; }
                li { margin-bottom: 0.5em; }
                blockquote { border-left: 4px solid #e2e8f0; padding-left: 15px; color: #718096; font-style: italic; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
                th, td { border: 1px solid #cbd5e0; padding: 8px; text-align: left; }
                th { background-color: #f7fafc; font-weight: 600; }
                
                @media print {
                    body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${content}
              <script>
                // Wait for fonts to load slightly
                setTimeout(() => {
                    window.print(); 
                    window.close();
                }, 500);
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
            // Find the Quill editor content div
            const element = document.querySelector('.ql-editor') || document.getElementById('document-preview-content');
            if (!element) {
                addToast("Could not find document content", "error");
                return;
            }
            const opt = {
                margin: [0.75, 0.75], // inch
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
            const text = tempDiv.textContent || tempDiv.innerText || "";
            const blob = new Blob([text], { type: 'text/plain' });
            downloadFile(blob, `${filename}.txt`);
            addToast("Downloading Text file...", "success");
        } else if (format === 'md') {
            // Enhanced HTML to Markdown conversion
            let md = content
              .replace(/<h1[^>]*>(.*?)<\/h1>/gim, '# $1\n\n')
              .replace(/<h2[^>]*>(.*?)<\/h2>/gim, '## $1\n\n')
              .replace(/<h3[^>]*>(.*?)<\/h3>/gim, '### $1\n\n')
              .replace(/<h4[^>]*>(.*?)<\/h4>/gim, '#### $1\n\n')
              .replace(/<strong[^>]*>(.*?)<\/strong>/gim, '**$1**')
              .replace(/<b[^>]*>(.*?)<\/b>/gim, '**$1**')
              .replace(/<em[^>]*>(.*?)<\/em>/gim, '*$1*')
              .replace(/<i[^>]*>(.*?)<\/i>/gim, '*$1*')
              .replace(/<br\s*\/?>/gim, '\n')
              .replace(/<p[^>]*>(.*?)<\/p>/gim, '$1\n\n')
              .replace(/<li[^>]*>(.*?)<\/li>/gim, '- $1\n')
              .replace(/<ul[^>]*>/gim, '')
              .replace(/<\/ul>/gim, '\n')
              .replace(/<ol[^>]*>/gim, '')
              .replace(/<\/ol>/gim, '\n')
              .replace(/&nbsp;/g, ' ')
              .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gim, '> $1\n\n')
              .replace(/<[^>]*>/g, ''); 
             const blob = new Blob([md], { type: 'text/markdown' });
             downloadFile(blob, `${filename}.md`);
             addToast("Downloading Markdown...", "success");
        } else if (format === 'docx') {
             // Add styles for Word
             const htmlString = `
                <!DOCTYPE html>
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>${filename}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; }
                        h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; color: #000000; }
                        h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #2E74B5; }
                        h3 { font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; color: #4a5568; }
                        p { margin-bottom: 10pt; }
                        ul { margin-bottom: 10pt; list-style-type: disc; }
                        ol { margin-bottom: 10pt; list-style-type: decimal; }
                        li { margin-bottom: 4pt; margin-left: 20px; }
                    </style>
                </head>
                <body>${content}</body>
                </html>`;
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

  // Helper for view switcher button classes
  const getViewButtonClass = (viewName: string) => {
      const isActive = activeView === viewName;
      return `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border
        ${isActive 
            ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20' 
            : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'}`;
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Save Template Modal */}
      {showSaveTemplateModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-6">
                     <h3 className="text-xl font-bold text-slate-900">Save Configuration</h3>
                     <p className="text-sm text-slate-500 mt-1">
                        Creating a template for <strong>{prompt.title}</strong>
                     </p>
                  </div>
                  
                  <div className="p-6">
                      <p className="text-sm text-slate-600 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800">
                          This will save the current <strong>{Object.keys(formData).length} fields</strong> as a reusable template. 
                          You can load it anytime from your profile menu.
                      </p>
                      
                      <form onSubmit={handleSaveTemplate}>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 'Grade 8 History - Unit 1'" 
                            className="w-full p-3 border border-slate-300 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setShowSaveTemplateModal(false)} 
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                type="submit" 
                                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm transition-colors flex items-center gap-2"
                              >
                                <Check size={18} />
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
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
             <button 
               onClick={() => setActiveView('document')}
               className={getViewButtonClass('document')}
             >
               <FileText size={16} /> Document
             </button>
             <button 
               onClick={() => setActiveView('narrative')}
               className={getViewButtonClass('narrative')}
             >
               <ImageIcon size={16} /> Visuals
             </button>
             <button 
               onClick={() => setActiveView('analytics')}
               className={getViewButtonClass('analytics')}
             >
               <BarChart2 size={16} /> Analytics
             </button>
             <button 
               onClick={() => setActiveView('chat')}
               className={getViewButtonClass('chat')}
             >
               <MessageSquare size={16} /> Chat
             </button>
          </div>
          
          <div className="relative">
            <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border
                ${showExportMenu ? 'bg-blue-50 text-primary border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
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
                    <button onClick={handlePrint} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 border-t border-slate-100">
                        <Printer size={16} className="text-slate-800"/> Print Document
                    </button>
                    <div className="h-px bg-slate-100 mx-4"></div>
                    <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700">
                        <FileCode size={16} className="text-orange-500"/> HTML File (.html)
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