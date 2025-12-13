
import React, { useEffect, useRef } from 'react';
import { NarrativeData, EvaluationData, PromptDefinition, GroundingMetadata } from '../../types';
import { Loader2, FileText, Image as ImageIcon, BarChart2, Sparkles, Brain, Link as LinkIcon } from 'lucide-react';
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
                quillRef.current = new window.Quill(editorContainerRef.current, {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'align': [] }],
                            ['clean']
                        ]
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
    <div className="h-full flex flex-col relative">
      
      {/* Prominent Loading Overlay */}
      {isGenerating && !content && (
         <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
             <div className="relative">
                 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                     <Brain size={40} className="text-primary" />
                 </div>
                 <div className="absolute top-0 right-0">
                     <Sparkles size={24} className="text-amber-400 animate-bounce" />
                 </div>
             </div>
             <h3 className="mt-6 text-xl font-bold text-slate-800">Generating Content</h3>
             <p className="text-slate-500 mt-2 max-w-sm text-center">AI is crafting your {prompt.title.toLowerCase()} based on your inputs. This usually takes about 10-20 seconds.</p>
             <div className="mt-8 w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-full origin-left"></div>
             </div>
         </div>
      )}

      {/* Document View */}
      {activeView === 'document' && (
        <div className="p-8 max-w-4xl mx-auto w-full h-full flex flex-col">
            <div id="document-preview" className="bg-white shadow-lg rounded-xl h-full border border-slate-200 animate-in fade-in duration-500 relative flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{formData.topic || formData.assignment || prompt.title}</h1>
                        <p className="text-slate-500 text-xs mt-1">Generated by AI School Hub • {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase tracking-wider font-bold text-slate-400">{prompt.category}</div>
                    </div>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 bg-white relative overflow-y-auto custom-scrollbar">
                 {/* 
                    If Generating: Show standard div with streaming content 
                    If Done: Show Quill Editor 
                 */}
                 {isGenerating ? (
                    <div className="p-8 prose prose-slate max-w-none">
                         <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
                         <div className="flex items-center gap-2 text-primary text-sm mt-4 animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Writing...</span>
                         </div>
                    </div>
                 ) : (
                    <div className="min-h-[500px] flex flex-col">
                        <div ref={editorContainerRef} className="flex-1 text-base"></div>
                    </div>
                 )}

                 {/* Grounding Sources Section */}
                 {!isGenerating && groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50">
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
                              <Radar name="Score" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
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
                                  <li key={i} className="text-sm text-slate-700 bg-yellow-50 p-2 rounded border border-yellow-100">
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
