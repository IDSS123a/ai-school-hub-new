// ===== FILE: /src/scripts/refactor-prompts-v6.ts =====
#!/usr/bin/env node
/**
 * V6 PROMPT MIGRATION SCRIPT
 * Usage: npx tsx src/scripts/refactor-prompts-v6.ts [--dry-run]
 * 
 * This script fetches active prompts, generates V6-compatible JSON templates,
 * and outputs them to /src/features/prompts/v6-templates/ for manual review.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const OUTPUT_DIR = path.join(__dirname, '../features/prompts/v6-templates');

async function main() {
  console.log('🔍 Fetching active prompts...');
  const { data: prompts, error } = await supabase.from('prompt_definitions').select('id, slug, name, category, prompt_text_en').eq('is_active', true);
  
  if (error) { console.error('DB Error:', error.message); process.exit(1); }
  console.log(`✅ Found ${prompts.length} active prompts.`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  prompts.forEach(prompt => {
    const template = {
      metadata: {
        id: prompt.id,
        slug: prompt.slug,
        name: prompt.name,
        category: prompt.category,
        legacy_text_ref: prompt.prompt_text_en.substring(0, 150) + '...',
        generated_at: new Date().toISOString()
      },
      input_schema: {
        type: 'object',
        properties: {},
        required: []
      },
      output_structure: ['intro', 'content', 'conclusion'],
      system_instructions: 'ROLE: Expert AI for IDSS.\nOBJECTIVE: Generate strict HTML5.\nFONT: Century Gothic.\nLANGUAGE: Match user input.'
    };

    const filePath = path.join(OUTPUT_DIR, `${prompt.slug}.v6.json`);
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Would write: ${filePath}`);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
      console.log(`💾 Saved: ${filePath}`);
    }
  });

  console.log('\n📋 MANUAL REVIEW CHECKLIST:');
  console.log('1. Open each .v6.json and fill input_schema.properties based on current UI fields.');
  console.log('2. Update output_structure to match required <section data-section="..."> tags.');
  console.log('3. Refine system_instructions with prompt-specific pedagogical constraints.');
  console.log('4. Update prompt_definitions table via Supabase Dashboard.');
  console.log('\n🏁 Script complete.');
}

main().catch(console.error);