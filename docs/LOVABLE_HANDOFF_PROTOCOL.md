# AI School Hub – Lovable.dev Handoff Protocol

## 1. Executive Summary
AI School Hub is a Vite+React+Supabase educational AI platform with 11 prompt-based tools for school staff. V6 infrastructure is complete; Lovable.dev will focus on UI polish, performance optimization, and world-class UX refinements.

- **Handoff status:** ✅ Backend logic complete, ⏳ UI polish pending
- **Target outcome:** The Platinum Industry Standard web app for education.

## 2. Architecture Overview
| Layer | Technology |
|-------|------------|
| **Frontend** | Vite, React 18, TypeScript |
| **Backend** | Supabase (Auth, DB, Storage) |
| **AI Engine** | Gemini 2.5 Flash (@google/genai) |
| **State Management** | Zustand, TanStack Query |

### Data Flow Diagram
```
User Input → EditorPage.tsx → PromptOrchestrator → compileV6SystemPrompt → Gemini API
                                     ↓
                              v6PromptValidator → Sanitized HTML → UI Render
                                     ↓
                              activity_logs (Supabase) → Analytics
```

### Key Files Map
- `src/features/prompts/promptOrchestrator.ts`: Core execution engine for V6 prompts.
- `src/features/prompts/v6-templates/V6_PROMPT_TEMPLATE_MASTER.ts`: Universal interface and master template.
- `src/features/prompts/promptCompiler.v6.ts`: Compiles JSON templates into Gemini system instructions.
- `src/features/prompts/v6PromptValidator.ts`: Enforces Platinum Standard HTML/Font requirements.
- `src/features/ai/geminiService.ts`: Low-level API wrapper for Gemini.
- `src/features/ai/keyRotation.ts`: Manages the rotation of 8 Gemini API keys.

## 3. V6 Prompt Infrastructure
The V6 infrastructure moves away from hardcoded strings to a schema-driven lifecycle:
1. **Template:** JSON-based definition of inputs, role, objective, and output sections.
2. **Compilation:** `promptCompiler.v6.ts` assembles the final system prompt.
3. **Execution:** `PromptOrchestrator` handles the API call with retry logic.
4. **Validation:** `v6PromptValidator` ensures output is valid HTML5 with Century Gothic font.
5. **Output:** Sanitized HTML is rendered in the `EditorPage`.

### JSON Schema Reference (V6PromptTemplate)
```json
{
  "meta": { "slug": "lesson-planner", "version": "6.0.0" },
  "input_schema": { "type": "object", "properties": { "topic": { "type": "string" } } },
  "output_structure": [
    { "id": "objectives", "label": "Learning Objectives", "required": true }
  ],
  "system_instructions": { "role": "Expert Teacher", "objective": "Create a lesson plan" }
}
```

### Category Defaults
| Category | Default Output Structure |
|----------|--------------------------|
| **planning** | objectives, lesson-flow, differentiation, assessment |
| **resources** | recommendations, alignment, accessibility, usage-tips |
| **organization** | timeline, roles, resources, risk-mitigation |
| **communication** | tone, structure, audience-adaptation, call-to-action |
| **administration** | compliance, formatting, approval-workflow, versioning |

### How to Add a New Prompt
1. Create a `[slug].v6.json` in `src/features/prompts/v6-templates/`.
2. Update the `prompt_definitions` table in Supabase with the JSON content.
3. Set `is_v6_enabled = true` in the database for that prompt.
4. Test in the UI with `USE_V6_ORCHESTRATOR = true` in `constants.ts`.

## 4. Extension Points for Lovable.dev
### UI Polish
- **Enhance:** `EditorPage.tsx` output renderer, loading skeletons, and transition animations.
- **Refine:** `FormInputSection.tsx` to support more complex input types (multi-select, file upload).
- **⚠️ DO NOT CHANGE:** `promptOrchestrator.ts`, `v6PromptValidator.ts`, or `promptCompiler.v6.ts` core logic without architectural review.

### Performance
- **Code Splitting:** Implement lazy loading for heavy editor components.
- **Memoization:** Use `React.memo` and `useMemo` in the `OutputRenderer` to prevent unnecessary re-renders during streaming.
- **Caching:** Optimize TanStack Query `staleTime` for prompt definitions.

### Analytics
- **Activity Logs:** Extend `logOrchestratorEvent` in `promptOrchestrator.ts` to track user satisfaction or "copy-to-clipboard" events.
- **A/B Testing:** Use the `version` field in `V6PromptTemplate` to compare different prompt strategies.

### Advanced Validation
- **Custom Rules:** Add regex-based pedagogical checks to `v6PromptValidator.ts` (e.g., ensuring "Bloom's Taxonomy" verbs are used in planning).

### Multi-language
- **Detection:** Improve `detectLanguage` in `languageStore.ts` to handle mixed-language inputs more gracefully.

## 5. Testing Strategy
### Pre-polish QA Checklist
- [ ] Run `npx tsx src/scripts/refactor-prompts-batch.ts --dry-run` to verify template integrity.
- [ ] Validate all 11 prompts with `USE_V6_ORCHESTRATOR=true`.
- [ ] Verify HTML output has `data-section` attributes and Century Gothic font.

### Vitest Integration
Enable the commented-out test stubs in `v6PromptValidator.ts` and `promptCompiler.v6.ts` once the Vitest environment is fully configured.

### E2E Testing
Setup Playwright to test the full generation flow:
1. User selects "Lesson Planner".
2. User fills form and clicks "Generate".
3. Verify output appears and contains expected sections.

### Regression Testing
Ensure the legacy flow still works by setting `USE_V6_ORCHESTRATOR = false` and verifying that prompts still generate content using the old `prompt_text_en` logic.

## 6. Security & Compliance Guidelines
- **Secrets:** Never commit `.env`. Use platform-provided secret management for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **API Key Rotation:** Managed in `keyRotation.ts`. Add new keys to the environment array as needed.
- **Data Privacy:** Supabase RLS (Row Level Security) is enabled. Ensure all queries include the `user_id` filter.
- **AI Safety:** Temperature is set to `0.4` for stability. Use `v6PromptValidator` to block malicious or malformed HTML.
- **GDPR:** Audit all logging to ensure no PII (Personally Identifiable Information) is stored in `activity_logs` metadata.

## 7. Polish Workflow: From V6 to Platinum Standard
- **Phase A (Week 1):** UI Consistency Audit. Ensure all AI outputs use unified CSS variables, Century Gothic font, and professional padding/margins.
- **Phase B (Week 2):** Performance Pass. Measure LCP (Largest Contentful Paint) and optimize heavy components. Ensure streaming is smooth.
- **Phase C (Week 3):** UX Refinements. Add micro-interactions (hover states, success toasts), smart suggestions, and a "Compare Versions" feature.
- **Phase D (Week 4):** Final QA. Cross-browser testing, accessibility audit (WCAG 2.1 AA), and mobile responsiveness check.

**Definition of "Platinum Standard":**
- All AI outputs render in < 3s (p95).
- Zero console errors during generation.
- 100% Lighthouse accessibility score.
- Mobile-responsive editor with touch-friendly inputs.

## 8. Success Metrics & QA Checklist
### Quantitative Metrics
- **Response Time:** < 3s for V6 prompts (p95).
- **Validation Pass Rate:** > 95% of outputs pass `v6PromptValidator` on the first try.
- **Token Efficiency:** Monitor `tokens_used` in logs to optimize prompt length.

### QA Checklist
| Test | Expected Result | Status |
|------|----------------|--------|
| Lesson Planner V6 output | Contains `data-section="objectives"`, Century Gothic font | ⬜ |
| Field Trip Planner validation | Auto-fixes missing font, strips markdown | ⬜ |
| Error Handling | Shows user-friendly error if AI fails 3 times | ⬜ |
| Legacy Fallback | Works correctly if `is_v6_enabled` is false | ⬜ |

## 9. Troubleshooting & Support
| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| "Missing required section" error | AI ignored output_structure mandate | Refine `system_instructions` in prompt JSON. |
| Font not applying | Root element missing inline style | Check `v6PromptValidator` auto-fix logic. |
| 429 Too Many Requests | API key quota reached | Check `keyRotation.ts` or add more Gemini keys. |
| malformed HTML | AI output cut off | Increase `maxOutputTokens` in orchestrator. |

- **Rollback Procedure:** Disable V6 for a single prompt by setting `is_v6_enabled = false` in Supabase, or globally by setting `USE_V6_ORCHESTRATOR = false` in `constants.ts`.

## 10. Appendices
### Appendix A: V6PromptTemplate Interface
```ts
export interface V6PromptTemplate {
  meta: {
    id: string;
    slug: string;
    name: string;
    category: string;
    version: string;
    minRole: UserRole;
    dependencies: string[];
  };
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  output_structure: Array<{
    id: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  system_instructions: {
    role: string;
    objective: string;
    language_mandate: string;
    output_rules: string[];
    forbidden_patterns: string[];
    edge_cases: string[];
  };
  validation: {
    required_font: string;
    required_html_version: string;
    section_validation_method: 'data-attribute' | 'text-matching' | 'hybrid';
  };
}
```

### Appendix B: Supabase SQL Snippets
```sql
-- Enable V6 for a specific prompt
UPDATE prompt_definitions 
SET is_v6_enabled = true, 
    prompt_template_v6 = '{"meta": {...}}' 
WHERE slug = 'lesson-planner';

-- View recent V6 errors
SELECT * FROM activity_logs 
WHERE action = 'v6_orchestration' 
  AND (metadata->>'isValid')::boolean = false 
ORDER BY created_at DESC;
```

### Appendix C: Glossary
- **V6:** The schema-driven prompt orchestration layer.
- **Platinum Standard:** The target quality level for output, UX, and performance.
- **Orchestrator:** The logic that coordinates AI calls, validation, and retries.
- **RLS:** Row Level Security (Supabase security feature).
