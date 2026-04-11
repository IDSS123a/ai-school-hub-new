// ===== FILE: /src/features/prompts/promptCompiler.v6.ts =====
import { V6PromptTemplate } from './v6-templates/V6_PROMPT_TEMPLATE_MASTER';
import { PromptExecutionContext } from '../../types/v6-prompt.schema';

/**
 * Escapes sensitive characters in a prompt string to prevent markdown or code block breakage.
 * Preserves intentional HTML tags like <h2>, <table>, etc.
 * 
 * @param input The raw string to sanitize
 * @returns A sanitized string safe for prompt injection
 */
export function escapePromptString(input: string): string {
  if (!input) return '';
  return input
    .replace(/`/g, '\\`')
    .replace(/"""/g, '\\"\\"\\"')
    .replace(/\${/g, '\\${');
}

/**
 * Compiles a V6 Prompt Template and Execution Context into a final system prompt for Gemini.
 * This function assembles role, objective, schema guidance, and strict output rules.
 * 
 * @param template The V6 Prompt Template configuration
 * @param context The current execution context (language, role, formData)
 * @returns A consolidated system prompt string
 * 
 * @example
 * const systemPrompt = compileV6SystemPrompt(lessonPlannerTemplate, context);
 */
export function compileV6SystemPrompt(template: V6PromptTemplate, context: PromptExecutionContext): string {
  const { input_schema, output_structure, system_instructions, validation } = template;
  
  // 1. Core Identity & Objective
  const identitySection = `
ROLE: ${system_instructions.role}
OBJECTIVE: ${system_instructions.objective}
LANGUAGE MANDATE: ${system_instructions.language_mandate} (Current Language: ${context.language.toUpperCase()})
`;

  // 2. Input Schema Guidance
  const inputGuidance = `
INPUT SCHEMA:
The user will provide data matching this schema:
${JSON.stringify(input_schema, null, 2)}
`;

  // 3. Output Structure & HTML Rules
  const sectionRequirements = output_structure
    .map(s => `- ID: "${s.id}" | Label: "${s.label}" | Required: ${s.required} | Description: ${s.description}`)
    .join('\n');

  const outputRules = `
OUTPUT FORMATTING RULES:
1. Use ${validation.required_html_version} only.
2. Root font must be ${validation.required_font}.
${system_instructions.output_rules.map((rule, i) => `${i + 3}. ${rule}`).join('\n')}

STRICT SECTION ENFORCEMENT:
Every section must be wrapped in <section data-section="ID"> where ID matches one of the following:
${sectionRequirements}
`;

  // 4. Negative Constraints
  const constraints = `
FORBIDDEN PATTERNS (DO NOT USE):
${system_instructions.forbidden_patterns.map(p => `- ${p}`).join('\n')}
`;

  // 5. Edge Case Handling
  const edgeCases = `
EDGE CASE HANDLING:
${system_instructions.edge_cases.map(ec => `- ${ec}`).join('\n')}
`;

  // 6. Final Assembly
  return `
${identitySection.trim()}

${inputGuidance.trim()}

${outputRules.trim()}

${constraints.trim()}

${edgeCases.trim()}

FINAL INSTRUCTION: Generate the complete HTML output now. No conversational filler.
`.trim();
}

// Test stub – enable when vitest configured:
/*
import { describe, it, expect } from 'vitest';
describe('compileV6SystemPrompt', () => {
  it('should include the role and objective in the output', () => {
    // ... test logic
  });
});
*/
