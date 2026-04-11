#!/usr/bin/env node
/**
 * AI SCHOOL HUB - V6 BATCH PROMPT REFACTOR SCRIPT
 * 
 * Usage:
 *   npx tsx src/scripts/refactor-prompts-batch.ts
 *   npx tsx src/scripts/refactor-prompts-batch.ts --dry-run
 *   npx tsx src/scripts/refactor-prompts-batch.ts --prompt-slug=lessonPlanner
 * 
 * Prerequisites:
 *   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in environment or .env
 *   - Node.js 18+ and tsx installed
 * 
 * Post-Generation Manual Steps:
 *   1. Review each generated [slug].v6.json file in /src/features/prompts/v6-templates/
 *   2. Fill in prompt-specific input_schema.properties based on actual UI fields
 *   3. Refine output_structure sections if defaults need adjustment
 *   4. Update Supabase prompt_definitions via dashboard or SQL
 *   5. Test each prompt with USE_V6_ORCHESTRATOR=true
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { V6PromptTemplate } from '../features/prompts/v6-templates/V6_PROMPT_TEMPLATE_MASTER';

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const TEMPLATE_DIR = path.join(process.cwd(), 'src/features/prompts/v6-templates');

// --- CLI Arguments ---
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const targetSlug = args.find(a => a.startsWith('--prompt-slug='))?.split('=')[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Generates default V6 structures based on prompt category
 */
function generateCategoryDefaults(category: string): Partial<V6PromptTemplate> {
  const defaults: Record<string, string[]> = {
    planning: ['objectives', 'lesson-flow', 'differentiation', 'assessment'],
    resources: ['recommendations', 'alignment', 'accessibility', 'usage-tips'],
    organization: ['timeline', 'roles', 'resources', 'risk-mitigation'],
    communication: ['tone', 'structure', 'audience-adaptation', 'call-to-action'],
    administration: ['compliance', 'formatting', 'approval-workflow', 'versioning']
  };

  const sections = defaults[category] || ['introduction', 'main-content', 'conclusion'];

  return {
    output_structure: sections.map(id => ({
      id,
      label: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `Generated ${id} section for ${category} category.`,
      required: true
    })),
    system_instructions: {
      role: `Elite ${category.charAt(0).toUpperCase() + category.slice(1)} Assistant for IDSS Sarajevo`,
      objective: `Generate professional ${category} documentation with high pedagogical standards.`,
      language_mandate: "Respond exclusively in the language specified in the user context.",
      output_rules: [
        "STRICT HTML5 ONLY. No Markdown.",
        "Use <h2> and <h3> for headings.",
        "Wrap sections in <section data-section='ID'>.",
        "Font: Century Gothic, sans-serif."
      ],
      forbidden_patterns: ["markdown bolding", "html/head/body tags", "conversational filler"],
      edge_cases: ["Handle missing inputs with <div data-missing-input='true'> warning."]
    }
  };
}

/**
 * Main Execution Logic
 */
async function runBatchRefactor() {
  console.log(`[INFO] Starting V6 Batch Refactor... ${isDryRun ? '(DRY RUN)' : ''}`);

  try {
    // 1. Fetch Prompts
    let query = supabase
      .from('prompt_definitions')
      .select('*')
      .eq('is_active', true);

    // Exclude already migrated if not targeting a specific slug
    if (!targetSlug) {
      query = query.or('is_v6_enabled.is.null,is_v6_enabled.eq.false');
    } else {
      query = query.eq('slug', targetSlug);
    }

    const { data: prompts, error } = await query;

    if (error) throw error;
    if (!prompts || prompts.length === 0) {
      console.log('[WARN] No active prompts found matching criteria.');
      return;
    }

    console.log(`[INFO] Found ${prompts.length} prompts to process.`);

    if (!fs.existsSync(TEMPLATE_DIR)) {
      console.log(`[INFO] Creating directory: ${TEMPLATE_DIR}`);
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    }

    // 2. Process Each Prompt
    for (const prompt of prompts) {
      console.log(`[INFO] Processing: ${prompt.slug}...`);

      const catDefaults = generateCategoryDefaults(prompt.category);

      const v6Template: V6PromptTemplate = {
        meta: {
          id: prompt.id,
          slug: prompt.slug,
          name: prompt.name,
          category: prompt.category,
          version: "6.0.0",
          minRole: (prompt.config?.access_roles?.[0] as any) || "teacher",
          dependencies: []
        },
        input_schema: {
          type: "object",
          properties: (prompt.input_fields_json || []).reduce((acc: any, field: any) => {
            acc[field.key || field.id] = {
              type: "string",
              description: field.label_bs || field.label || "User input field"
            };
            return acc;
          }, {}),
          required: (prompt.input_fields_json || [])
            .filter((f: any) => f.required)
            .map((f: any) => f.key || f.id)
        },
        output_structure: catDefaults.output_structure!,
        system_instructions: {
          ...catDefaults.system_instructions!,
          // @ts-ignore - Adding legacy reference for manual refinement
          legacy_reference: prompt.prompt_text_en?.substring(0, 200) + "..."
        } as any,
        validation: {
          required_font: "Century Gothic",
          required_html_version: "HTML5",
          section_validation_method: "data-attribute"
        }
      };

      // 3. File Operations
      const fileName = `${prompt.slug}.v6.json`;
      const filePath = path.join(TEMPLATE_DIR, fileName);

      if (isDryRun) {
        console.log(`[DRY-RUN] Would write ${fileName} with ${Object.keys(v6Template.input_schema.properties).length} fields.`);
        continue;
      }

      // Backup existing
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`[INFO] Created backup: ${fileName}.bak`);
      }

      // Write JSON
      fs.writeFileSync(filePath, JSON.stringify(v6Template, null, 2), 'utf-8');
      console.log(`[SUCCESS] Generated: ${fileName}`);
    }

    console.log('[INFO] Batch refactor complete.');
    process.exit(0);

  } catch (err: any) {
    console.error(`[ERROR] Critical failure: ${err.message}`);
    process.exit(1);
  }
}

runBatchRefactor();
