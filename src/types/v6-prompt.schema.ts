// ===== FILE: /src/types/v6-prompt.schema.ts =====
export type UserRole = 'teacher' | 'staff' | 'admin';
export type LanguageCode = 'bs' | 'de' | 'en';

export interface PromptV6Config {
  id: string;
  slug: string;
  version: string;
  category: string;
  minRole: UserRole;
  dependencies: string[];
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  outputStructure: string[];
  validationRules: Array<{
    type: 'min_length' | 'contains_keyword' | 'regex_match';
    value: string | number;
    errorMessage: string;
  }>;
}

export interface PromptExecutionContext {
  userRole: UserRole;
  language: LanguageCode;
  formData: Record<string, any>;
  existingDocumentContext?: string;
  chainHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ValidationResult {
  isValid: boolean;
  html: string;
  errors: string[];
  warnings: string[];
  autoFixesApplied: string[];
}

export class PromptValidationError extends Error {
  constructor(public errors: string[], public partialHtml?: string) {
    super(`V6 Validation Failed: ${errors.join(', ')}`);
    this.name = 'PromptValidationError';
  }
}