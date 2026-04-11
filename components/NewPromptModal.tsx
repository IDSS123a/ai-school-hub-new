import React, { useState } from 'react';
import { X, Send, Sparkles, Loader2, Copy, CheckCircle } from 'lucide-react';
import { PromptRequestForm, UserProfile } from '../types';
import { architectPromptFromRequest } from '../services/geminiService';
import { useToast } from '../context/ToastContext';

interface NewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

const NewPromptModal: React.FC<NewPromptModalProps> = ({ isOpen, onClose, user }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);

  const [formData, setFormData] = useState<PromptRequestForm>({
    timestamp: new Date().toISOString(),
    email: user?.email || '',
    fullName: user?.name || '',
    company: '',
    projectTitle: '',
    primaryGoal: '',
    specificTask: '',
    users: 'Myself and my team',
    targetAudience: 'Students',
    platform: 'AI School Hub',
    outputStructure: 'Clear headings, bullet points, professional tone',
    userInputs: 'Topic, Grade Level, Subject',
    toneStyle: 'Professional, Academic, Encouraging',
    lengthDetail: 'Medium length, about 1 page',
    branding: 'No specific branding',
    outputFormat: 'Plain Text',
    keywords: '',
    avoidTopics: '',
    rolePersona: 'Expert Educational Consultant',
    examples: '',
    prdRequest: false,
    deadline: '',
    callRequest: false,
    additionalContext: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
      setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneratedJson(null);

    try {
        // 1. Generate the JSON Architecture using Gemini
        const jsonOutput = await architectPromptFromRequest(formData);
        setGeneratedJson(jsonOutput);

        // 2. Construct the Email Body
        const emailSubject = `NEW PROMPT REQUEST: ${formData.projectTitle}`;
        const emailBody = `
REQUEST DETAILS:
----------------
Requester: ${formData.fullName} (${formData.email})
Company: ${formData.company}
Project: ${formData.projectTitle}
Goal: ${formData.primaryGoal}
Task: ${formData.specificTask}
Persona: ${formData.rolePersona}
Inputs: ${formData.userInputs}
Output Style: ${formData.outputStructure}
Tone: ${formData.toneStyle}

----------------------------------------------------
AI ARCHITECTED PROMPT (Ready for Database):
----------------------------------------------------
${jsonOutput}
----------------------------------------------------
`;
        
        // 3. Prepare Mailto Link (Note: URL length limits apply, so we also offer copy)
        const mailtoLink = `mailto:mulalic71@gmail.com?cc=${formData.email}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody.substring(0, 1500))}... (See attached or copied text for full details)`;

        // Copy full content to clipboard as backup BEFORE opening window (to preserve focus)
        try {
            await navigator.clipboard.writeText(emailBody);
            addToast("Full request copied to clipboard (paste into email if truncated).", "info");
        } catch (clipboardError) {
            console.warn("Clipboard write failed:", clipboardError);
            // Don't fail the whole request if clipboard fails
        }
        
        // Open Mail Client
        window.open(mailtoLink, '_blank');
        
        addToast("Request generated! Email draft opened.", "success");

    } catch (error) {
        console.error("Error creating prompt request:", error);
        addToast("Failed to generate request. Please try again.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-primary" /> Request New Prompt
             </h2>
             <p className="text-slate-500 text-sm mt-1">Define your custom AI tool needs. We will engineer it for you.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
             <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
                
                {/* Section 1: Contact */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">1. Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                            <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
                            <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Company/Organization</label>
                            <input name="company" value={formData.company} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Optional" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Core Purpose */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">2. Project Definition</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Title / Prompt Name *</label>
                            <input required name="projectTitle" value={formData.projectTitle} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g., 'IEP Generator' or 'Science Quiz Creator'" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Brief Description / Primary Goal *</label>
                            <textarea required name="primaryGoal" value={formData.primaryGoal} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none min-h-[80px]" placeholder="What is the main purpose of this tool?" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Specific Task(s) for AI *</label>
                            <textarea required name="specificTask" value={formData.specificTask} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none min-h-[80px]" placeholder="Step-by-step, what should the AI do?" />
                        </div>
                    </div>
                </div>

                {/* Section 3: The Mechanics */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">3. Input & Output Mechanics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">User Inputs *</label>
                            <textarea required name="userInputs" value={formData.userInputs} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="What will you provide to the AI? (e.g., Topic, Student Age, Text to analyze)" />
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-sm font-semibold text-slate-700 mb-1">Desired Output Structure *</label>
                             <textarea required name="outputStructure" value={formData.outputStructure} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Bullet points? Table? Json? Essay format?" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tone & Style</label>
                            <input name="toneStyle" value={formData.toneStyle} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. Professional, Witty, Strict" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Persona</label>
                            <input name="rolePersona" value={formData.rolePersona} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. Act as a Physics Professor" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Length / Detail Level</label>
                            <input name="lengthDetail" value={formData.lengthDetail} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Output Format</label>
                            <select name="outputFormat" value={formData.outputFormat} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                                <option>Plain Text</option>
                                <option>Markdown</option>
                                <option>HTML</option>
                                <option>JSON</option>
                                <option>CSV</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Constraints & Avoidance</label>
                            <input name="avoidTopics" value={formData.avoidTopics} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="What should the AI strictly avoid?" />
                        </div>
                    </div>
                </div>
                
                {/* Section 4: Examples (Optional) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">4. Examples (Optional but Recommended)</h3>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">1-3 Input/Output Examples</label>
                        <textarea name="examples" value={formData.examples} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none min-h-[100px]" placeholder="Input: 'Photosynthesis' -> Output: 'Process by which...'" />
                    </div>
                </div>

                {/* Section 5: Logistics */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2">5. Delivery & Logistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={formData.prdRequest} onChange={(e) => handleCheckboxChange('prdRequest', e.target.checked)} className="w-4 h-4 text-primary" />
                                <span className="text-sm">Include Product Requirement Doc (PRD)</span>
                             </label>
                        </div>
                        <div>
                             <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input type="checkbox" checked={formData.callRequest} onChange={(e) => handleCheckboxChange('callRequest', e.target.checked)} className="w-4 h-4 text-primary" />
                                <span className="text-sm">Request clarification call</span>
                             </label>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Context / Links</label>
                             <textarea name="additionalContext" value={formData.additionalContext} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                    </div>
                </div>

            </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center">
            <div className="text-xs text-slate-500 max-w-md">
                Submitting triggers an AI Architect process to draft your prompt and opens your email client to send the request to <strong>administrator</strong>.
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Architecting Prompt...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Request
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NewPromptModal;