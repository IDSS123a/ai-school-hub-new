// ===== FILE: /src/features/prompts/promptOrchestrator.ts =====
import { PromptV6Config, PromptExecutionContext } from '../../types/v6-prompt.schema';
import { validatePlatinumHTML } from './htmlValidator';
import { generatePrompt } from '../ai/geminiService';
import { supabase } from '../../lib/supabase';

async function logOrchestratorEvent(slug: string, duration: number, isValid: boolean, errors: string[]) {
  try {
    await supabase.from('activity_logs').insert({
      action: 'v6_orchestration',
      entity_type: 'prompt',
      entity_id: slug,
      metadata: { isValid, errors, duration_ms: duration, timestamp: new Date().toISOString() }
    }).catch(() => {});
  } catch {}
}

export class PromptOrchestrator {
  private static MAX_RETRIES = 2;

  static async execute(config: PromptV6Config, context: PromptExecutionContext): Promise<string> {
    const startTime = Date.now();
    let attempts = 0;
    let lastErrors: string[] = [];

    // 1. Input Validation
    const missing = config.inputSchema.required.filter(k => !context.formData?.[k]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    while (attempts < this.MAX_RETRIES) {
      try {
        const systemPrompt = this.buildSystemPrompt(config, context);
        const userPrompt = this.buildUserPrompt(context);

        const rawResponse = await generatePrompt(systemPrompt, userPrompt, false);
        
        const validation = validatePlatinumHTML(rawResponse, {
          requiredSections: config.outputStructure,
          font: 'Century Gothic'
        });

        if (validation.isValid) {
          await logOrchestratorEvent(config.slug, Date.now() - startTime, true, []);
          return validation.html;
        }

        lastErrors = validation.errors;
        attempts++;
      } catch (err: any) {
        lastErrors.push(err.message || 'Unknown execution error');
        attempts++;
      }
    }

    const errorHtml = this.generateErrorTemplate(lastErrors);
    await logOrchestratorEvent(config.slug, Date.now() - startTime, false, lastErrors);
    return errorHtml;
  }

  private static buildSystemPrompt(config: PromptV6Config, context: PromptExecutionContext): string {
    const sections = config.outputStructure.map(s => `- <section data-section="${s}">`).join('\n');
    return `ROLE: Elite Pedagogical Assistant for IDSS Sarajevo.
OBJECTIVE: Generate professional educational content in ${context.language.toUpperCase()}.

OUTPUT RULES (NON-NEGOTIABLE):
1. STRICT HTML5 ONLY. NO MARKDOWN, NO BACKTICKS, NO ASTERISKS.
2. FONT: Century Gothic, sans-serif (inline style on root element).
3. REQUIRED STRUCTURE (MUST INCLUDE ALL):
${sections}

LANGUAGE: Respond exclusively in ${context.language}.
STYLING: Use <h2>/<h3> for headers, <table> for data, <ul>/<ol> for lists.
FORBIDDEN: \`\`\`html, **text**, # headers, markdown syntax.

EDGE CASE: If any input is missing or ambiguous, insert <div data-missing-input="true" style="color:#B91C1C; padding:12px; background:#FEF2F2; border-radius:8px;">Molimo proverite unos: [FIELD_NAME]</div>.
`;
  }

  private static buildUserPrompt(context: PromptExecutionContext): string {
    const inputs = Object.entries(context.formData || {})
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    return `INPUT DATA:\n${inputs}\n\nGenerate complete HTML document now:`;
  }

  private static generateErrorTemplate(errors: string[]): string {
    return `<div style="font-family: 'Century Gothic', sans-serif; border: 2px solid #DC2626; padding: 20px; border-radius: 12px; background: #FEF2F2; color: #991B1B;">
      <h2 style="margin:0 0 12px 0; color:#DC2626;">⚠️ V6 Generisanje nije uspjelo</h2>
      <p>AI output nije prošao validaciju. Greške:</p>
      <ul style="margin:0; padding-left:20px;">${errors.map(e => `<li>${e}</li>`).join('')}</ul>
      <p style="margin-top:12px; font-size:13px; color:#4B5563;">Savjet: Provjerite unesene podatke ili pokušajte ponovo.</p>
    </div>`;
  }
}