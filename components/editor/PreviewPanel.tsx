import React, { useEffect, useRef } from 'react';
import { NarrativeData, EvaluationData, PromptDefinition } from '../../types';
import { Loader2, FileText, Image as ImageIcon, BarChart2, Bold, Italic, List, ListOrdered, Heading1, Heading2, Underline, Sparkles, Brain } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PreviewPanelProps {
  activeView: 'document' | 'narrative' | 'analytics' | 'chat';
  content: string;
  narrative: NarrativeData | null;
  evaluation: EvaluationData | null;
  loadingExtras: boolean;
  isGenerating: boolean;
  prompt: PromptDefinition;
  formData: Record<string, string>;
  onContentUpdate?: (newContent: string) => void;
}

const ToolbarButton = ({ icon: Icon, onClick, active = false }: { icon: any, onClick: () => void, active?: boolean }) => (
    <button 
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${active ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
    >
        <Icon size={16} />
    </button>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  activeView,
  content,
  narrative,
  evaluation,
  loadingExtras,
  isGenerating,
  prompt,
  formData,
  onContentUpdate
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external content changes to the editor ONLY when generating or initially loading
  // We do NOT want to overwrite user edits if they are typing
  useEffect(() => {
    if (editorRef.current && (isGenerating || !editorRef.current.innerHTML)) {
       // Convert newlines to breaks if it looks like plain text
       const formatted = content.includes('<') ? content : content.replace(/\n/g, '<br/>');
       if (editorRef.current.innerHTML !== formatted) {
           editorRef.current.innerHTML = formatted;
       }
    }
  }, [content, isGenerating]);

  const handleInput = () => {
      if (editorRef.current && onContentUpdate) {
          onContentUpdate(editorRef.current.innerHTML);
      }
  };

  const execCmd = (cmd: string, val: string = '') => {
      document.execCommand(cmd, false, val);
      if (editorRef.current) editorRef.current.focus();
  };

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
        <div className="p-8 max-w-4xl mx-auto w-full">
            <div id="document-preview" className="bg-white shadow-lg rounded-xl min-h-[800px] border border-slate-200 animate-in fade-in duration-500 relative flex flex-col">
            
            {/* Rich Text Toolbar */}
            <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1 rounded-t-xl">
                <ToolbarButton icon={Bold} onClick={() => execCmd('bold')} />
                <ToolbarButton icon={Italic} onClick={() => execCmd('italic')} />
                <ToolbarButton icon={Underline} onClick={() => execCmd('underline')} />
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <ToolbarButton icon={Heading1} onClick={() => execCmd('formatBlock', 'H1')} />
                <ToolbarButton icon={Heading2} onClick={() => execCmd('formatBlock', 'H2')} />
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <ToolbarButton icon={List} onClick={() => execCmd('insertUnorderedList')} />
                <ToolbarButton icon={ListOrdered} onClick={() => execCmd('insertOrderedList')} />
            </div>

            <div className="p-12 flex-1" id="document-preview-content">
                {/* Header Simulation */}
                <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{formData.topic || formData.assignment || prompt.title}</h1>
                        <p className="text-slate-500 text-sm mt-1">Generated by AI School Hub • {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase tracking-wider font-bold text-slate-400">{prompt.category}</div>
                    </div>
                </div>
                
                {/* Mini Loading Indicator during streaming if content exists */}
                {isGenerating && content && (
                    <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 text-sm animate-in slide-in-from-bottom-5">
                         <Loader2 size={14} className="animate-spin" />
                         <span>Streaming...</span>
                    </div>
                )}

                {/* Editable Content Area */}
                <div 
                    ref={editorRef}
                    contentEditable={true}
                    onInput={handleInput}
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h2:text-primary prose-h2:mt-6 prose-p:text-slate-700 focus:outline-none min-h-[500px]"
                    dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} 
                />
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