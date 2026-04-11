
import React, { useState, useRef, useEffect } from 'react';
import { PromptDefinition } from '../../types';
import { Loader2, RefreshCw, ChevronRight, Save, Sparkles, Clock, Lightbulb } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FormPanelProps {
  prompt: PromptDefinition;
  formData: Record<string, string>;
  onInputChange: (key: string, value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onSaveTemplate: () => void;
}

const GET_EXAMPLES = (id: string): Array<Record<string, string>> => {
    const examples: Record<string, Array<Record<string, string>>> = {
        'lesson-planner': [
            { subject: 'Science', grade: '7', topic: 'Photosynthesis', objectives: 'Understand how plants convert light into energy.' },
            { subject: 'Math', grade: '5', topic: 'Fractions', objectives: 'Learn to add and subtract fractions with common denominators.' }
        ],
        'writing-assistant': [
            { doc_type: 'Parent Newsletter', audience: 'Elementary Parents', key_points: 'School picnic update, next week holidays, science fair winners.', tone: 'Warm/Community' },
            { doc_type: 'Grant Proposal', audience: 'Education Foundation', key_points: 'Requesting funds for a new computer lab to improve digital literacy.', tone: 'Professional' }
        ],
        'expert-consultant': [
            { role: 'Child Psychologist', context: 'Students are showing increased anxiety during testing weeks.', question: 'What practical mindfulness exercises can teachers implement?' },
            { role: 'EdTech Specialist', context: 'Transitioning to hybrid learning next semester.', question: 'How can we maintain student engagement in a split environment?' }
        ]
    };
    return examples[id] || [
        { topic: 'Global Warming', audience: 'High School Students', learning_goal: 'Explore impact on coastal cities.' },
        { topic: 'Ancient Rome', audience: 'Grade 6', learning_goal: 'Daily life and governance.' }
    ];
};

const FormPanel: React.FC<FormPanelProps> = ({ 
  prompt, 
  formData, 
  onInputChange, 
  onGenerate, 
  isGenerating,
  onSaveTemplate
}) => {
  const { addToast } = useToast();
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const startX = useRef(0);
  const startWidth = useRef(0);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const key = `autosave_${prompt.id}`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed && typeof parsed === 'object') {
                Object.entries(parsed).forEach(([k, v]) => {
                    if (typeof v === 'string') onInputChange(k, v);
                });
                addToast("Restored unsaved draft", "info");
                setLastSaved(new Date());
            }
        } catch (e) {}
    }
  }, [prompt.id]);

  useEffect(() => {
    const interval = setInterval(() => {
        const currentData = formDataRef.current;
        if (Object.keys(currentData).length > 0) {
            localStorage.setItem(`autosave_${prompt.id}`, JSON.stringify(currentData));
            setLastSaved(new Date());
        }
    }, 30000);
    return () => clearInterval(interval);
  }, [prompt.id]);

  const handleApplyExample = (example: Record<string, string>) => {
      Object.entries(example).forEach(([k, v]) => onInputChange(k, v));
      addToast("Example applied to form!", "success");
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = panelWidth;
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      setPanelWidth(Math.max(300, Math.min(startWidth.current + delta, 800)));
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const promptExamples = GET_EXAMPLES(prompt.id);

  return (
    <div 
      style={{ width: window.innerWidth < 768 ? '100%' : `${panelWidth}px` }}
      className={`bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden relative flex-shrink-0 ${isResizing ? 'select-none' : ''} transition-width duration-200`}
    >
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Configure</h2>
        <p className="text-sm text-slate-500 mt-1">{prompt.description}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {prompt.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">{field.label}</label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                  value={formData[field.key] || ''}
                  onChange={(e) => onInputChange(field.key, e.target.value)}
                >
                  <option value="" disabled>Select option</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                  <ChevronRight className="rotate-90" size={16} />
                </div>
              </div>
            ) : field.type === 'textarea' ? (
              <textarea
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[120px] resize-none"
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
              />
            ) : (
              <input
                type={field.type}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Example Suggestions */}
        <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-primary" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Example Suggestions</h4>
            </div>
            <div className="flex flex-wrap gap-2">
                {promptExamples.map((ex, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleApplyExample(ex)}
                        className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-left shadow-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                        {ex['topic'] || ex['subject'] || ex['doc_type'] || 'Example Idea'}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
        {lastSaved && (
             <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 mb-2">
                <Clock size={10} />
                <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
             </div>
        )}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all shadow-md hover:shadow-lg relative overflow-hidden transform hover:scale-[1.02] active:scale-95 duration-200
            ${isGenerating ? 'bg-primary cursor-not-allowed' : 'bg-primary hover:bg-amber-400'}`}
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
        </button>
        <button onClick={onSaveTemplate} className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 hover:bg-white hover:border-slate-300 transition-all outline-none focus:ring-2 focus:ring-slate-200">
            <Save size={18} /> Save as Template
        </button>
      </div>

      <div onMouseDown={startResizing} className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 z-50 transition-colors" />
    </div>
  );
};

export default FormPanel;
