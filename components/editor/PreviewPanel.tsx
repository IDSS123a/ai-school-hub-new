import React, { useEffect, useRef, useState } from 'react';
import { NarrativeData, EvaluationData, PromptDefinition, GroundingMetadata } from '../../types';
// Fixed: Imported missing icons from lucide-react
import { Loader2, FileText, Image as ImageIcon, Link as LinkIcon, Undo2, Redo2, PenTool, BarChart2, Lightbulb, Sparkles } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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

  useEffect(() => {
    if (activeView === 'document' && !isGenerating && editorContainerRef.current) {
        if (!isQuillInitialized.current && window.Quill) {
            const icons = window.Quill.import('ui/icons');
            // Use SVG paths for standard undo/redo buttons in Quill toolbar
            icons['undo'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>';
            icons['redo'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>';

            quillRef.current = new window.Quill(editorContainerRef.current, {
                theme: 'snow',
                modules: {
                    history: {
                        delay: 1000,
                        maxStack: 100,
                        userOnly: true
                    },
                    toolbar: {
                        container: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'blockquote', 'code-block'],
                            ['clean'],
                            ['undo', 'redo']
                        ],
                        handlers: {
                            'undo': function() { this.quill.history.undo(); },
                            'redo': function() { this.quill.history.redo(); }
                        }
                    }
                }
            });
            
            if (content) quillRef.current.clipboard.dangerouslyPasteHTML(content);

            quillRef.current.on('text-change', (delta: any, oldDelta: any, source: string) => {
                 if (onContentUpdate && quillRef.current && source === 'user') {
                     onContentUpdate(quillRef.current.root.innerHTML);
                 }
            });

            isQuillInitialized.current = true;
        }
    }

    // Update content if changed remotely
    if (quillRef.current && content !== quillRef.current.root.innerHTML && !isGenerating && activeView === 'document') {
        const selection = quillRef.current.getSelection();
        quillRef.current.clipboard.dangerouslyPasteHTML(content);
        if (selection) quillRef.current.setSelection(selection);
    }

    return () => {
        if (activeView !== 'document' || isGenerating) {
             isQuillInitialized.current = false;
             quillRef.current = null;
        }
    };
  }, [activeView, isGenerating, content]);

  if (!content && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
         <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center max-w-sm text-center">
            <FileText size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Content Yet</h3>
            <p className="text-sm">Configure the tool on the left and click "Generate Content" to begin your planning session.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col relative bg-slate-100 overflow-hidden">
      {isGenerating && !content && (
         <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="https://i.postimg.cc/B61fmVMV/IDSS_Logo_D1.png" className="w-8 h-8 object-contain" alt="" />
                </div>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">Architecting Enterprise Document</h3>
             <p className="text-slate-500 text-sm max-w-xs text-center">Applying pedagogical standards and formatting for professional output...</p>
         </div>
      )}

      {activeView === 'document' && (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <style>
            {`
                .ql-editor { padding: 60px 80px !important; max-width: 900px; margin: 2rem auto; background: white; min-height: calc(100vh - 200px); box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05); border-radius: 4px; border: 1px solid #f1f5f9; }
                .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: white; position: sticky; top: 0; z-index: 20; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .ql-container.ql-snow { border: none !important; flex: 1; overflow-y: auto; background: #f8fafc; }
                .ql-formats { margin-right: 20px !important; }
                @media (max-width: 768px) { .ql-editor { padding: 40px 20px !important; margin: 1rem; } }
            `}
            </style>
            {isGenerating ? (
                <div className="flex-1 p-10 overflow-y-auto bg-white prose max-w-none">
                    <div className="max-w-[900px] mx-auto ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            ) : (
                <div ref={editorContainerRef} className="flex-1 flex flex-col"></div>
            )}
        </div>
      )}

      {activeView === 'narrative' && (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                        <PenTool size={20} className="text-primary" /> Visual Narrative Summary
                    </h3>
                    <p className="text-slate-700 leading-relaxed text-lg mb-8">{narrative?.summary || 'Generating executive summary...'}</p>
                    
                    {narrative?.imageUrl ? (
                        <div className="relative group overflow-hidden rounded-2xl border border-slate-100 shadow-xl">
                            <img src={narrative.imageUrl} alt="Summary" className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    ) : (
                        <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                            <Loader2 size={32} className="animate-spin text-slate-300" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {narrative?.keyTakeaways.map((takeaway, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">{i + 1}</div>
                            <p className="text-slate-700 font-medium">{takeaway}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[400px]">
                        <h3 className="text-xl font-bold mb-8 text-slate-900 flex items-center gap-2">
                            <BarChart2 size={20} className="text-secondary" /> Pedagogical Quality Radar
                        </h3>
                        {evaluation ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                    { subject: 'Clarity', A: evaluation.scores.clarity },
                                    { subject: 'Relevance', A: evaluation.scores.relevance },
                                    { subject: 'Engagement', A: evaluation.scores.engagement },
                                    { subject: 'Inclusivity', A: evaluation.scores.inclusivity },
                                ]}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                    <Radar name="Score" dataKey="A" stroke="#08ABE6" fill="#08ABE6" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="animate-spin text-slate-200" size={40} />
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                            <Lightbulb size={20} className="text-amber-500" /> Improvement Suggestions
                        </h3>
                        <div className="space-y-4">
                            {evaluation ? evaluation.suggestions.map((s, i) => (
                                <div key={i} className="p-4 bg-amber-50/50 text-amber-900 rounded-xl border border-amber-100 text-sm leading-relaxed flex gap-3">
                                    <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <span>{s}</span>
                                </div>
                            )) : (
                                <div className="space-y-3">
                                    <div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div>
                                    <div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div>
                                    <div className="h-12 bg-slate-50 rounded-xl animate-pulse"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {evaluation?.feedback && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                         <h3 className="text-xl font-bold mb-4 text-slate-900">Comprehensive Feedback</h3>
                         <p className="text-slate-600 leading-relaxed italic">"{evaluation.feedback}"</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;