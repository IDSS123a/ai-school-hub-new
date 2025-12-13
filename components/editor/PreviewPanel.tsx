
import React, { useEffect, useRef } from 'react';
import { NarrativeData, EvaluationData, PromptDefinition, GroundingMetadata } from '../../types';
import { Loader2, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Declare Quill on window
declare global {
    interface Window {
        Quill: any;
    }
}

interface PreviewPanelProps {
  activeView: 'document' | 'narrative' | 'analytics' | 'chat';
  content: string;
  narrative: NarrativeData | null;
  evaluation: EvaluationData | null;
  groundingMetadata: GroundingMetadata | null;
  loadingExtras: boolean;
  isGenerating: boolean;
  prompt: PromptDefinition;
  formData: Record<string, string>;
  onContentUpdate?: (newContent: string) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  activeView,
  content,
  narrative,
  evaluation,
  groundingMetadata,
  loadingExtras,
  isGenerating,
  prompt,
  formData,
  onContentUpdate
}) => {
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isQuillInitialized = useRef(false);

  // Initialize Quill when activeView is 'document' and we are NOT generating
  useEffect(() => {
    if (activeView === 'document' && !isGenerating && editorContainerRef.current) {
        if (!isQuillInitialized.current) {
            // Check if Quill is loaded
            if (window.Quill) {
                // Register custom icons if needed or rely on text if SVG fails to load from theme
                // But for standard 'snow' theme, we can inject SVG icons for undo/redo if they are missing by default
                const icons = window.Quill.import('ui/icons');
                icons['undo'] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>';
                icons['redo'] = '<svg viewbox="0 0 18 18"><polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>';

                quillRef.current = new window.Quill(editorContainerRef.current, {
                    theme: 'snow',
                    modules: {
                        history: {
                            delay: 2000,
                            maxStack: 500,
                            userOnly: true
                        },
                        toolbar: {
                            container: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'color': [] }, { 'background': [] }],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                [{ 'indent': '-1'}, { 'indent': '+1' }], 
                                [{ 'align': [] }],
                                ['clean'],
                                ['undo', 'redo'] // Add undo/redo to toolbar
                            ],
                            handlers: {
                                'undo': function() { this.quill.history.undo(); },
                                'redo': function() { this.quill.history.redo(); }
                            }
                        }
                    }
                });
                
                // Initialize content
                if (content) {
                    quillRef.current.clipboard.dangerouslyPasteHTML(content);
                }

                // Handle changes
                quillRef.current.on('text-change', () => {
                     if (onContentUpdate && quillRef.current) {
                         onContentUpdate(quillRef.current.root.innerHTML);
                     }
                });

                isQuillInitialized.current = true;
            } else {
                console.error("Quill JS not loaded");
            }
        } else if (quillRef.current && content && quillRef.current.root.innerHTML !== content) {
            // Only update if significantly different and not focused (basic check)
            const currentText = quillRef.current.getText();
            if (currentText.trim().length === 0 && content.length > 0) {
                 quillRef.current.clipboard.dangerouslyPasteHTML(content);
            }
        }
    }

    return () => {
        if (activeView !== 'document' || isGenerating) {
             isQuillInitialized.current = false;
             quillRef.current = null;
        }
    };
  }, [activeView, isGenerating]);

  if (!content && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
         <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
           <FileText size={32} className="opacity-50" />
         </div>
         <p>Configure the prompt and click generate to start.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-100">
      
      {/* Prominent Loading Overlay */}
      {isGenerating && !content && (
         <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
             <div className="relative">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                     <FileText size={40} className="text-primary" />
                 </div>
             </div>
             <h3 className="mt-6 text-xl font-bold text-slate-800">Generating Content</h3>
             <p className="text-slate-500 mt-2 max-w-sm text-center">AI is crafting your {prompt.title.toLowerCase()} based on your inputs. This usually takes about 10-20 seconds.</p>
             <div className="mt-8 w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
             </div>
         </div>
      )}

      {/* Document View - MAXIMIZED */}
      {activeView === 'document' && (
        <div className="w-full h-full flex flex-col">
            <div id="document-preview" className="bg-white h-full shadow-md animate-in fade-in duration-500 relative flex flex-col overflow-hidden">
            
            {/* Content Area */}
            <div className="flex-1 bg-white relative overflow-y-auto custom-scrollbar">
                 <style>
                    {`
                        .prose table { width: 100%; border-collapse: collapse; margin-top: 1em; margin-bottom: 1em; }
                        .prose th, .prose td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
                        .prose th { background-color: #f8fafc; font-weight: 600; color: #334155; }
                        .prose tr:nth-child(even) { background-color: #fcfcfc; }
                        .prose h1 { text-align: center; margin-bottom: 0.5rem; color: #1e293b; }
                        .prose h2 { text-align: center; margin-top: 0; color: #475569; font-weight: 500; font-size: 1.25rem; }
                        .prose h3 { color: #035EA1; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; margin-top: 2rem; }
                        .ql-editor { padding: 40px !important; max-width: 1000px; margin: 0 auto; height: auto !important; min-height: 100%; }
                        .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 12px; position: sticky; top: 0; z-index: 10; }
                        .ql-undo, .ql-redo { margin-left: 10px; }
                    `}
                 </style>
                 
                 {/* 
                    If Generating: Show standard div with streaming content 
                    If Done: Show Quill Editor 
                 */}
                 {isGenerating ? (
                    <div className="p-8 prose prose-slate max-w-5xl mx-auto">
                         <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
                         <div className="flex items-center gap-2 text-primary text-sm mt-4 animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Writing...</span>
                         </div>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">
                        {/* The Editor container simulates the 'page' */}
                        <div ref={editorContainerRef} className="bg-white shadow-sm min-h-full mx-auto w-full max-w-5xl"></div>
                    </div>
                 )}

                 {/* Grounding Sources Section - Appended at bottom of scroll if available */}
                 {!isGenerating && groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 max-w-5xl mx-auto">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <LinkIcon size={14} /> Sources & Citations
                        </h4>
                        <ul className="space-y-2">
                            {groundingMetadata.groundingChunks.map((chunk, idx) => (
                                chunk.web ? (
                                    <li key={idx} className="text-xs">
                                        <a 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-2"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">{idx + 1}</span>
                                            {chunk.web.title}
                                        </a>
                                    </li>
                                ) : null
                            ))}
                        </ul>
                    </div>
                 )}
            </div>

            </div>
        </div>
      )}

      {/* Narrative View */}
      {activeView === 'narrative' && (
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in slide-in-from-right-4 duration-300">
           {!narrative && !loadingExtras ? (
             <div className="text-center p-12 text-slate-400">Analysis pending...</div>
           ) : (
             <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-900 mb-4">Executive Summary</h3>
                 {narrative ? <p className="text-slate-700 leading-relaxed">{narrative.summary}</p> : <div className="h-20 bg-slate-100 animate-pulse rounded"></div>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Visual Aid</h3>
                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                       {narrative?.imageUrl ? (
                         <img src={narrative.imageUrl} alt="Generated visual" className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center text-slate-400">
                           <ImageIcon size={32} className="mb-2 opacity-50"/>
                           <span className="text-xs">{loadingExtras ? 'Generating Visual...' : 'Visual not available'}</span>
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Key Takeaways</h3>
                    {narrative ? (
                       <ul className="space-y-2">
                         {narrative.keyTakeaways.map((t, i) => (
                           <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                             <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                             {t}
                           </li>
                         ))}
                       </ul>
                    ) : (
                       <div className="space-y-2">
                          {[1,2,3].map(i => <div key={i} className="h-6 bg-slate-100 animate-pulse rounded w-full"></div>)}
                       </div>
                    )}
                 </div>
              </div>
             </>
           )}
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in slide-in-from-right-4 duration-300">
           {!evaluation && !loadingExtras ? (
             <div className="text-center p-12 text-slate-400">Evaluation pending...</div>
           ) : (
             <>
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-900 mb-2">Pedagogical Score</h3>
                     <div className="h-64">
                        {evaluation ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                              { subject: 'Clarity', A: evaluation.scores.clarity, fullMark: 100 },
                              { subject: 'Relevance', A: evaluation.scores.relevance, fullMark: 100 },
                              { subject: 'Engagement', A: evaluation.scores.engagement, fullMark: 100 },
                              { subject: 'Inclusivity', A: evaluation.scores.inclusivity, fullMark: 100 },
                            ]}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar name="Score" dataKey="A" stroke="#035EA1" fill="#035EA1" fillOpacity={0.4} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full bg-slate-100 animate-pulse rounded"></div>}
                     </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-900 mb-2">Detailed Feedback</h3>
                     <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {evaluation ? (
                           <>
                             <p className="text-sm text-slate-600 mb-4 italic">"{evaluation.feedback}"</p>
                             <h4 className="font-semibold text-sm text-slate-900 mb-2">Suggestions for Improvement:</h4>
                             <ul className="space-y-2">
                               {evaluation.suggestions.map((s, i) => (
                                  <li key={i} className="text-sm text-slate-700 bg-amber-50 p-2 rounded border border-amber-100">
                                    💡 {s}
                                  </li>
                               ))}
                             </ul>
                           </>
                        ) : <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-4 bg-slate-100 animate-pulse rounded w-full"></div>)}</div>}
                     </div>
                  </div>
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
