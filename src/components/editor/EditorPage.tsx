// ===== FILE: /src/components/editor/EditorPage.tsx =====
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/useAuth';
import { useLanguage } from '../../features/language/languageStore';
import { usePrompts, mapPromptToV6Config, type PromptFromDB } from '../../features/prompts/usePrompts';
import { generatePrompt } from '../../features/ai/geminiService';
import { PromptOrchestrator } from '../../features/prompts/promptOrchestrator';
import { USE_V6_ORCHESTRATOR } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { AIStatusIndicator } from '../shared/AIStatusIndicator';
import { EmptyState } from '../shared/EmptyState';
import { EditorToolbar } from './EditorToolbar';
import { OutputRenderer } from './OutputRenderer';
import { FormInputSection } from './FormInputSection';
import type { GeneratedDocument, FormField } from '../../types';

interface EditorPageProps {
  promptSlug: string;
}

export function EditorPage({ promptSlug }: EditorPageProps) {
  const { currentUser } = useAuth();
  const { currentLanguage, detectLanguage } = useLanguage();
  const { data: prompts, isLoading: promptsLoading } = usePrompts();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [outputHtml, setOutputHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<'standard' | 'advanced' | 'collaborative'>('standard');

  const prompt = prompts?.find(p => p.slug === promptSlug);

  // Auto-detect language from form inputs when they change
  useEffect(() => {
    const textValues = Object.values(formData).filter(v => typeof v === 'string' && v.length > 10);
    if (textValues.length > 0) {
      const detected = detectLanguage(textValues[0] as string);
      if (detected && detected !== currentLanguage) {
        // Optional: auto-switch language or just note it
        console.log(`Detected language: ${detected}`);
      }
    }
  }, [formData, detectLanguage, currentLanguage]);

  const handleFormChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt || !currentUser) return;
    
    setIsGenerating(true);
    setError(null);
    setOutputHtml('');

    try {
      // ===== V6 ORCHESTRATOR FLOW (Feature-flagged) =====
      if (USE_V6_ORCHESTRATOR && prompt.is_v6_enabled) {
        try {
          const v6Config = mapPromptToV6Config(prompt);
          if (!v6Config) {
            throw new Error(`Failed to map prompt "${prompt.slug}" to V6 config`);
          }

          const context = {
            userRole: currentUser.role,
            language: currentLanguage || 'bs',
            formData: formData,
            existingDocumentContext: undefined, // Can be extended for document editing
            chainHistory: [] // Can be extended for multi-turn conversations
          };

          const html = await PromptOrchestrator.execute(v6Config, context);
          setOutputHtml(html);
          setIsGenerating(false);
          return; // V6 flow complete - exit early
        } catch (v6Error: any) {
          console.warn('V6 orchestrator failed, falling back to legacy flow', {
            prompt: prompt.slug,
            error: v6Error?.message || v6Error
          });
          // Continue to legacy flow below
        }
      }

      // ===== LEGACY FLOW (Preserved for backward compatibility) =====
      const systemInstruction = buildLegacySystemInstruction(prompt, currentLanguage);
      const userPrompt = buildLegacyUserPrompt(formData, activeProtocol);

      const content = await generatePrompt(systemInstruction, userPrompt, false);
      
      // Legacy post-processing: ensure HTML-only output
      const sanitized = sanitizeLegacyOutput(content);
      setOutputHtml(sanitized);

    } catch (err: any) {
      console.error('Generation failed', err);
      setError(err?.message || 'Došlo je do greške prilikom generiranja. Pokušajte ponovo.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, currentUser, formData, currentLanguage, activeProtocol]);

  const handleExport = useCallback((format: 'pdf' | 'docx' | 'html') => {
    if (!outputHtml) return;
    // Existing export logic preserved
    console.log(`Exporting as ${format}`);
  }, [outputHtml]);

  const handleSave = useCallback(async () => {
    if (!outputHtml || !currentUser || !prompt) return;
    
    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          title: formData?.topic || `${prompt.name} - ${new Date().toLocaleDateString()}`,
          prompt_id: prompt.id,
          protocol: activeProtocol,
          form_data: formData,
          output_content: outputHtml,
          owner_id: currentUser.id
        });
      
      if (error) throw error;
      console.log('Document saved successfully');
    } catch (err) {
      console.error('Save failed', err);
      setError('Nije moguće sačuvati dokument. Pokušajte ponovo.');
    }
  }, [outputHtml, currentUser, prompt, formData, activeProtocol]);

  if (promptsLoading) return <EmptyState title="Učitavanje..." />;
  if (!prompt) return <EmptyState title="Prompt nije pronađen" description={`Slug: ${promptSlug}`} />;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <EditorToolbar
        prompt={prompt}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        onSave={handleSave}
        onExport={handleExport}
        canSave={!!outputHtml}
        canExport={!!outputHtml}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input Form */}
        <div className="flex flex-col gap-4 overflow-y-auto rounded-lg border bg-card p-4">
          <h3 className="text-lg font-semibold">Unos podataka</h3>
          <FormInputSection
            inputFields={prompt.input_fields_json as FormField[]}
            formData={formData}
            onChange={handleFormChange}
            disabled={isGenerating}
          />
          
          <div className="mt-auto pt-4">
            <AIStatusIndicator 
              isGenerating={isGenerating} 
              error={error}
              protocol={activeProtocol}
              onProtocolChange={setActiveProtocol}
            />
          </div>
        </div>

        {/* Output Preview */}
        <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-2">
            <h3 className="text-sm font-medium">Generirani sadržaj</h3>
          </div>
          <OutputRenderer
            html={outputHtml}
            isLoading={isGenerating}
            promptSlug={prompt.slug}
          />
        </div>
      </div>
    </div>
  );
}

// ===== LEGACY HELPER FUNCTIONS (Preserved for fallback) =====

function buildLegacySystemInstruction(prompt: PromptFromDB, language: string): string {
  return `
You are an expert educational assistant for IDSS Sarajevo.
Language: Respond exclusively in ${language.toUpperCase()}.
Output Format: STRICT HTML5 only. NO MARKDOWN. NO backticks. NO asterisks.
Font: Use Century Gothic, sans-serif via inline CSS.
Structure: Professional, academic formatting with clear hierarchy.
${prompt.prompt_text_en || ''}
`.trim();
}

function buildLegacyUserPrompt(formData: Record<string, any>, protocol: string): string {
  const inputs = Object.entries(formData)
    .filter(([_, v]) => v && String(v).trim())
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');
  
  const protocolNote = protocol === 'advanced' 
    ? '\n\n[ADVANCED MODE] Provide deeper analysis and more detailed structure.' 
    : protocol === 'collaborative'
    ? '\n\n[COLLABORATIVE MODE] Include reflection questions and adaptation suggestions.'
    : '';
  
  return `Generate educational content based on these inputs:\n\n${inputs}${protocolNote}`;
}

function sanitizeLegacyOutput(rawHtml: string): string {
  // Strip common markdown artifacts that AI might include despite instructions
  return rawHtml
    .replace(/```html\s*|\s*```/g, '')
    .replace(/```\s*|\s*```/g, '')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/__(.*?)__/g, '<i>$1</i>')
    .replace(/^#\s+(.*)$/gm, '<h2>$1</h2>')
    .replace(/^##\s+(.*)$/gm, '<h3>$1</h3>')
    .trim();
}