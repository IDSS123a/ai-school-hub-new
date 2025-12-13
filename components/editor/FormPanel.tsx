
import React, { useState, useRef, useEffect } from 'react';
import { PromptDefinition } from '../../types';
import { Loader2, RefreshCw, ChevronRight, Save, Sparkles } from 'lucide-react';

interface FormPanelProps {
  prompt: PromptDefinition;
  formData: Record<string, string>;
  onInputChange: (key: string, value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onSaveTemplate: () => void;
}

const FormPanel: React.FC<FormPanelProps> = ({ 
  prompt, 
  formData, 
  onInputChange, 
  onGenerate, 
  isGenerating,
  onSaveTemplate
}) => {
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

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
      const newWidth = Math.max(300, Math.min(startWidth.current + delta, 800));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Determine width style based on window size
  const getWidthStyle = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
          return { width: '100%' };
      }
      return { width: `${panelWidth}px` };
  };

  return (
    <div 
      style={getWidthStyle()}
      className={`bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden relative flex-shrink-0 ${isResizing ? 'select-none' : ''} w-full md:w-auto transition-width duration-200`}
    >
      {/* Content */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
        <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Configure
            </h2>
            <p className="text-sm text-slate-500 mt-1">{prompt.description}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {prompt.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">
              {field.label}
            </label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[120px] resize-none"
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
              />
            ) : (
              <input
                type={field.type}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder={field.placeholder}
                value={formData[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all shadow-md hover:shadow-lg relative overflow-hidden transform hover:scale-[1.02] active:scale-95 duration-200
            ${isGenerating ? 'bg-primary cursor-not-allowed' : 'bg-primary hover:bg-blue-600'}`}
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          )}
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Generating Content...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generate Content</span>
            </>
          )}
        </button>

        <button
            onClick={onSaveTemplate}
            disabled={isGenerating}
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 hover:bg-white hover:border-slate-300 transition-all transform hover:scale-[1.02] active:scale-95 duration-200"
        >
            <Save size={18} /> Save as Template
        </button>
      </div>

      {/* Resize Handle (Desktop Only) */}
      <div 
        onMouseDown={startResizing}
        className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/20 z-50 transition-colors opacity-0 hover:opacity-100 active:opacity-100 active:bg-blue-500/50"
      />
    </div>
  );
};

export default FormPanel;
