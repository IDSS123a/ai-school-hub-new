// ===== FILE: /src/features/prompts/v6-templates/V6_PROMPT_TEMPLATE_MASTER.ts =====
import { PromptExecutionContext, UserRole } from '../../../types/v6-prompt.schema';

/**
 * Universal interface for V6 Platinum Standard Prompts.
 * This structure is designed to be stored in the `prompt_template_v6` field of the `prompt_definitions` table.
 */
export interface V6PromptTemplate {
  meta: {
    id: string; // Internal UUID or ID
    slug: string; // URL-friendly identifier (e.g., 'lesson-planner')
    name: string; // Human-readable name
    category: string; // e.g., 'planning', 'communication'
    version: string; // Semantic versioning (e.g., '6.0.0')
    minRole: UserRole; // Minimum authorization required
    dependencies: string[]; // Other prompt slugs this depends on
  };
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      placeholder?: string;
      options?: Array<{ value: string; label: string }>;
    }>;
    required: string[];
  };
  output_structure: Array<{
    id: string; // Section identifier used in data-section attribute
    label: string; // Human-readable label for the section
    description: string; // Guidance for the AI on what this section contains
    required: boolean; // Whether validation should fail if this section is missing
  }>;
  system_instructions: {
    role: string; // The persona the AI should adopt
    objective: string; // The primary goal of the generation
    language_mandate: string; // Instructions on language handling
    output_rules: string[]; // Non-negotiable formatting rules
    forbidden_patterns: string[]; // Patterns to avoid (e.g., markdown, specific phrases)
    edge_cases: string[]; // Instructions for handling ambiguous or missing inputs
  };
  validation: {
    required_font: string; // e.g., 'Century Gothic'
    required_html_version: string; // e.g., 'HTML5'
    section_validation_method: 'data-attribute' | 'text-matching' | 'hybrid';
  };
}

/**
 * Master Template Instance
 * Use this as a reference for refactoring all legacy prompts to V6.
 */
export const V6_PROMPT_TEMPLATE_MASTER: V6PromptTemplate = {
  meta: {
    id: "MASTER_TEMPLATE_ID", // [CUSTOMIZE PER PROMPT]
    slug: "master-template", // [CUSTOMIZE PER PROMPT]
    name: "Master Educational Template", // [CUSTOMIZE PER PROMPT]
    category: "general", // [CUSTOMIZE PER PROMPT]
    version: "6.0.0",
    minRole: "teacher",
    dependencies: []
  },
  input_schema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "The main subject or topic of the document",
        placeholder: "e.g., Photosynthesis"
      },
      target_audience: {
        type: "string",
        description: "The group for whom the content is intended",
        placeholder: "e.g., Grade 7 Students"
      }
      // [ADD ADDITIONAL FIELDS AS PER PROMPT REQUIREMENTS]
    },
    required: ["topic", "target_audience"]
  },
  output_structure: [
    {
      id: "introduction",
      label: "Introduction",
      description: "A brief overview of the topic and objectives",
      required: true
    },
    {
      id: "main-content",
      label: "Main Content",
      description: "The core educational material, structured with headers and lists",
      required: true
    },
    {
      id: "summary",
      label: "Summary & Conclusion",
      description: "Key takeaways and closing remarks",
      required: true
    }
    // [DEFINE ALL SECTIONS REQUIRED FOR THE PLATINUM OUTPUT]
  ],
  system_instructions: {
    role: "Elite Pedagogical Assistant for IDSS Sarajevo",
    objective: "Generate high-quality, professional educational content that is ready for immediate classroom or administrative use.",
    language_mandate: "Respond exclusively in the language specified in the user context. Maintain academic tone and correct grammar.",
    output_rules: [
      "STRICT HTML5 ONLY. No Markdown, no backticks, no asterisks.",
      "Use <h2> and <h3> for all headings.",
      "Wrap each section in <section data-section='{section_id}'>.",
      "Use <table> for data comparisons and <ul>/<ol> for lists.",
      "Apply inline style 'font-family: Century Gothic, sans-serif;' to the root container."
    ],
    forbidden_patterns: [
      "Avoid using markdown bolding (**text**); use <b> or <strong> instead.",
      "Do not include <html>, <head>, or <body> tags.",
      "Do not apologize or provide conversational filler."
    ],
    edge_cases: [
      "If inputs are insufficient, provide a high-level framework and insert a warning div: <div data-missing-input='true'>.",
      "If the topic is controversial, maintain a neutral, objective, and evidence-based pedagogical stance."
    ]
  },
  validation: {
    required_font: "Century Gothic",
    required_html_version: "HTML5",
    section_validation_method: "data-attribute"
  }
};

/**
 * Assembles the final system prompt for the Gemini API based on the V6 template and execution context.
 * 
 * @param template The V6 Prompt Template configuration
 * @param context The current execution context (language, user role, etc.)
 * @returns A consolidated string to be used as the System Instruction
 */
export function compileV6SystemPrompt(template: V6PromptTemplate, context: PromptExecutionContext): string {
  // Implementation will handle dynamic language injection and rule consolidation
  return ""; 
}
