// ===== FILE: /src/features/prompts/usePrompts.ts =====
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PromptV6Config, UserRole } from '../../types/v6-prompt.schema';

export interface PromptFromDB {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_active: boolean;
  // V6 Fields
  version: string;
  min_role: UserRole;
  input_schema_json: any;
  output_structure_json: string[];
  is_v6_enabled: boolean;
  dependencies: string[];
  prompt_text_en: string; // Legacy fallback
  input_fields_json: any[];
}

export function mapPromptToV6Config(dbPrompt: PromptFromDB): PromptV6Config | null {
  if (!dbPrompt.is_v6_enabled) return null;
  try {
    return {
      id: dbPrompt.id,
      slug: dbPrompt.slug,
      version: dbPrompt.version || '1.0.0',
      category: dbPrompt.category,
      minRole: dbPrompt.min_role || 'teacher',
      dependencies: Array.isArray(dbPrompt.dependencies) ? dbPrompt.dependencies : [],
      inputSchema: typeof dbPrompt.input_schema_json === 'string' 
        ? JSON.parse(dbPrompt.input_schema_json) 
        : (dbPrompt.input_schema_json || { type: 'object', properties: {}, required: [] }),
      outputStructure: Array.isArray(dbPrompt.output_structure_json) 
        ? dbPrompt.output_structure_json 
        : [],
      validationRules: []
    };
  } catch {
    return null;
  }
}

export function usePrompts() {
  return useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_definitions')
        .select('id, slug, name, description, icon, category, is_active, version, min_role, input_schema_json, output_structure_json, is_v6_enabled, dependencies, prompt_text_en, input_fields_json')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as PromptFromDB[];
    },
    staleTime: 1000 * 60 * 5
  });
}