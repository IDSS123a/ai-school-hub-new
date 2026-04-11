// ===== FILE: /src/test/v6-orchestrator.test.ts =====
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptOrchestrator } from '../features/prompts/promptOrchestrator';
import { validatePlatinumHTML } from '../features/prompts/htmlValidator';
import * as geminiService from '../features/ai/geminiService';
import * as supabaseLib from '../lib/supabase';

vi.mock('../features/ai/geminiService', () => ({
  generatePrompt: vi.fn()
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }))
  }
}));

describe('V6 Orchestrator & Validator', () => {
  const mockConfig: any = {
    slug: 'lesson-planner',
    inputSchema: { required: ['topic'] },
    outputStructure: ['learning-objectives', 'lesson-flow'],
    version: '6.0.0',
    category: 'planning',
    minRole: 'teacher',
    dependencies: [],
    validationRules: []
  };

  const mockContext = {
    language: 'bs' as const,
    userRole: 'teacher' as const,
    formData: { topic: 'Fotosinteza' }
  };

  beforeEach(() => vi.clearAllMocks());

  it('should throw on missing required fields', async () => {
    await expect(PromptOrchestrator.execute(mockConfig, { ...mockContext, formData: {} }))
      .rejects.toThrow('Missing required fields: topic');
  });

  it('should validate HTML structure and strip markdown', () => {
    const raw = '<section data-section="learning-objectives">**Cilj**</section>\n<section data-section="lesson-flow">Korak 1</section>';
    const res = validatePlatinumHTML(raw, { requiredSections: mockConfig.outputStructure, font: 'Century Gothic' });
    expect(res.isValid).toBe(true);
    expect(res.html).not.toContain('**');
  });

  it('should execute end-to-end with mocked AI', async () => {
    const validHtml = `<div style="font-family: 'Century Gothic', sans-serif;">
      <section data-section="learning-objectives">Objašnjenje</section>
      <section data-section="lesson-flow">Tok</section>
    </div>`;
    vi.mocked(geminiService.generatePrompt).mockResolvedValue(validHtml);

    const result = await PromptOrchestrator.execute(mockConfig, mockContext);
    expect(result).toContain('data-section="learning-objectives"');
    expect(geminiService.generatePrompt).toHaveBeenCalled();
  });

  it('should return error template on validation failure after retries', async () => {
    vi.mocked(geminiService.generatePrompt).mockResolvedValue('<p>No sections here</p>');
    const result = await PromptOrchestrator.execute(mockConfig, mockContext);
    expect(result).toContain('V6 Generisanje nije uspjelo');
    expect(result).toContain('Missing required section');
  });
});