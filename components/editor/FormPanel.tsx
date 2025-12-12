import React from 'react';
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
  return (
    <div className="w-1/3 min-w-[350px] max-w-[450px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
        <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Configure
            </h2>
            <p className="text-sm text-slate-500 mt-1">{prompt.description}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all shadow-md hover:shadow-lg relative overflow-hidden
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
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-slate-600 border border-slate-200 hover:bg-white hover:border-slate-300 transition-all"
        >
            <Save size={18} /> Save as Template
        </button>
      </div>
    </div>
  );
};

export default FormPanel;