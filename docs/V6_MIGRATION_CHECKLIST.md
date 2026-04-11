# V6 Prompt Orchestrator Migration Checklist

## 1. Infrastructure Setup
- [x] Create `v6-prompt.schema.ts` core types
- [x] Implement `HtmlValidator` utility
- [x] Implement `PromptOrchestrator` core logic
- [x] Add `USE_V6_ORCHESTRATOR` flag to `constants.ts`

## 2. Database & API
- [x] Update `PromptFromDB` interface in `usePrompts.ts`
- [x] Add `mapPromptToV6Config` helper
- [ ] Update Supabase `prompt_definitions` table schema (Manual Step)
  - Add `is_v6_enabled` (boolean)
  - Add `prompt_template_v6` (text)
  - Add `input_schema_json` (jsonb)
  - Add `output_schema_json` (jsonb)
  - Add `chain_config` (jsonb)

## 3. Frontend Integration
- [x] Modify `EditorPage.tsx` to use V6 orchestrator conditionally
- [x] Ensure legacy fallback works correctly
- [x] Verify state management (loading, error, output)

## 4. Templates
- [x] Convert Lesson Planner to V6 format
- [ ] Convert Writing Assistant to V6 format
- [ ] Convert Event Planner to V6 format

## 5. Testing & Validation
- [x] Create unit tests for Orchestrator
- [ ] Perform end-to-end testing with real Gemini API
- [ ] Verify HTML output quality and safety
