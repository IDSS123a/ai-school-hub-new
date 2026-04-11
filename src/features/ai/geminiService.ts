// ═══════════════════════════════════════════════════════
// GEMINI 2.5 FLASH SERVICE — v2.0
// Smart language detection + Maximum quality output
// Follows XLSX Constitution protocols exactly
// ═══════════════════════════════════════════════════════

import { keyRotationManager } from './keyRotation';
import type { AIGenerationRequest, AIGenerationResult } from '../../types';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  systemInstruction?: { parts: Array<{ text: string }> };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
    thinkingConfig?: { thinkingBudget: number };
  };
}

// ─── Language detection ───────────────────────────────────
function detectLanguage(formData: Record<string, unknown>): string {
  const allText = Object.values(formData)
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();

  // German patterns
  const dePatterns = /\b(der|die|das|und|ist|ich|sie|wir|nicht|für|mit|auf|von|zu|in|ein|eine|dem|den|des|wird|werden|haben|sein|dass|auch|aber|noch|schule|klasse|fach|thema|ziel|methode|kompetenz|unterricht|lehrplan|jahrgangsstufe)\b/g;
  const deMatches = (allText.match(dePatterns) || []).length;

  // Bosnian/Croatian/Serbian patterns
  const bsPatterns = /\b(je|su|za|na|se|da|ili|ali|kao|koji|koja|koje|ima|sam|smo|nastavni|čas|razred|predmet|tema|cilj|metoda|škola|učenik|učenici|nastavnik|plan|program|aktivnosti|obrazovni|kurikulum|kompetencija|procjena|materijal)\b/g;
  const bsMatches = (allText.match(bsPatterns) || []).length;

  // English patterns
  const enPatterns = /\b(the|and|for|with|this|that|are|was|were|have|has|will|lesson|grade|subject|topic|goal|method|school|student|students|teacher|plan|curriculum|assessment|learning|objectives|activities|educational|competency)\b/g;
  const enMatches = (allText.match(enPatterns) || []).length;

  if (deMatches > bsMatches && deMatches > enMatches) return 'de';
  if (enMatches > bsMatches && enMatches > deMatches) return 'en';
  return 'bs'; // default: Bosnian
}

// ─── Build system instruction from prompt text ────────────
function buildSystemInstruction(request: AIGenerationRequest): string {
  const detectedLang = detectLanguage(request.form_data);
  const langInstruction = {
    bs: 'Odgovaraj ISKLJUČIVO na bosanskom/hrvatskom/srpskom jeziku. Svi naslovi, oznake, tablice i tekst moraju biti na bosanskom.',
    de: 'Antworte AUSSCHLIESSLICH auf Deutsch. Alle Titel, Bezeichnungen, Tabellen und Texte müssen auf Deutsch sein.',
    en: 'Respond EXCLUSIVELY in English. All titles, labels, tables and text must be in English.',
  }[detectedLang as 'bs' | 'de' | 'en'];

  const baseInstruction = request.prompt_text ??
    `You are an elite AI assistant for AI School Hub at
    Internationale Deutsche Schule Sarajevo (IDSS).
    Generate world-class, academically rigorous content.`;

  return `${baseInstruction}

═══════════════════════════════════════════════════════
DETECTED USER LANGUAGE: ${detectedLang.toUpperCase()}
LANGUAGE MANDATE: ${langInstruction}
═══════════════════════════════════════════════════════

QUALITY MANDATE — NON-NEGOTIABLE:
1. This output will be used by professional educators at a
   German international school. It must meet the highest
   academic and pedagogical standards.
2. ALL modules specified in the prompt MUST be present and
   fully developed — not summarized or abbreviated.
3. Apply the 3-Protocol system exactly as defined:
   - Protocol 1 (Intake): Validate all inputs, flag issues
   - Protocol 2 (Synthesis): Research, Chain-of-Thought,
     Metacognitive Pass ("Is this the best possible answer?")
   - Protocol 3 (Output): Professional HTML, zero Markdown
4. Output MUST be a single self-contained HTML block with
   inline CSS only. NO markdown. NO backtick fences.
5. Font: Century Gothic, sans-serif throughout.
6. Include the IDSS fixed header and footer EXACTLY as
   specified — NEVER translate these branding elements.
7. Include AI_OUTPUT_METADATA comment at top.
8. End with exactly 3 intelligent, contextual follow-up
   suggestions relevant to the specific content generated.
9. Minimum output length: comprehensive and complete.
   A lesson plan must have ALL sections fully developed.
   Do NOT produce a brief summary.

METACOGNITIVE SELF-CHECK (perform internally before output):
□ Are ALL required modules present and fully developed?
□ Is the content specific to the exact inputs provided?
□ Is the HTML valid with proper inline CSS?
□ Is the language consistent throughout?
□ Does the content meet publication-quality standards?
□ Would a German Oberstudienrat be satisfied with this?`;
}

// ─── Build user message ───────────────────────────────────
function buildPrompt(request: AIGenerationRequest): string {
  const detectedLang = detectLanguage(request.form_data);

  const formEntries = Object.entries(request.form_data)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');

  return `GENERATION REQUEST:
Protocol activated: ${request.protocol.toUpperCase()}
Detected language: ${detectedLang.toUpperCase()}
Prompt ID: ${request.prompt_id}

USER INPUTS:
${formEntries}

EXECUTION INSTRUCTIONS:
1. Apply Protocol 1: Validate all inputs above.
   If any critical input is missing or ambiguous,
   insert [MISSING INPUT WARNING] in the output and
   proceed with best-effort content.
2. Apply Protocol 2: Synthesize using all available
   knowledge. Apply Metacognitive Pass.
3. Apply Protocol 3: Generate the complete, professional
   HTML output now. Include ALL modules. Do not abbreviate.
   Include the AI_OUTPUT_METADATA hidden comment at the top.

Generate the full, academically rigorous output now:`;
}

// ─── Core generation function ─────────────────────────────
export async function generateContent(
  request: AIGenerationRequest,
  onChunk?: (chunk: string) => void
): Promise<AIGenerationResult> {
  const keyInfo = keyRotationManager.getNextKey();

  if (!keyInfo) {
    throw new Error(
      'Svi Gemini API ključevi su iskorišteni za danas. Pokušajte sutra.'
    );
  }

  const { key, index: keyIndex } = keyInfo;
  const startTime = Date.now();

  // Temperature per protocol
  const tempByProtocol: Record<string, number> = {
    standard:      0.65,
    advanced:      0.55,
    collaborative: 0.50,
  };

  const body: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildPrompt(request) }],
      },
    ],
    systemInstruction: {
      parts: [{ text: buildSystemInstruction(request) }],
    },
    generationConfig: {
      temperature:     tempByProtocol[request.protocol] ?? 0.60,
      maxOutputTokens: 32768, // Maximum for comprehensive output
      topP:            0.95,
      topK:            64,
    },
  };

  try {
    if (request.streaming && onChunk) {
      return await streamGeneration(body, key, keyIndex, onChunk, startTime);
    } else {
      return await standardGeneration(body, key, keyIndex, startTime);
    }
  } catch (error) {
    keyRotationManager.reportError(keyIndex);
    throw error;
  }
}

// ─── Streaming generation ─────────────────────────────────
async function streamGeneration(
  body: GeminiRequest,
  key: string,
  keyIndex: number,
  onChunk: (chunk: string) => void,
  startTime: number
): Promise<AIGenerationResult> {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:streamGenerateContent?key=${key}&alt=sse`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = (errorData as any)?.error?.message ?? response.statusText;
    throw new Error(`Gemini API greška (${response.status}): ${msg}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          fullContent += text;
          onChunk(text);
        }
        totalTokens = parsed?.usageMetadata?.totalTokenCount ?? totalTokens;
      } catch {
        // Skip malformed SSE chunks
      }
    }
  }

  keyRotationManager.reportSuccess(keyIndex);

  return {
    content:      fullContent,
    tokens_used:  totalTokens,
    key_index:    keyIndex,
    duration_ms:  Date.now() - startTime,
    model:        GEMINI_MODEL,
  };
}

// ─── Standard generation ──────────────────────────────────
async function standardGeneration(
  body: GeminiRequest,
  key: string,
  keyIndex: number,
  startTime: number
): Promise<AIGenerationResult> {
  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = (errorData as any)?.error?.message ?? response.statusText;
    throw new Error(`Gemini API greška (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const tokens  = data?.usageMetadata?.totalTokenCount ?? 0;

  keyRotationManager.reportSuccess(keyIndex);

  return {
    content,
    tokens_used:  tokens,
    key_index:    keyIndex,
    duration_ms:  Date.now() - startTime,
    model:        GEMINI_MODEL,
  };
}

// ─── AI Chat (refinement with history) ───────────────────
export async function refineWithChat(
  originalContent:  string,
  userMessage:      string,
  chatHistory:      Array<{ role: 'user' | 'assistant'; content: string }>,
  promptContext:    string,
  detectedLang:     string = 'bs',
  onChunk?:         (chunk: string) => void
): Promise<string> {
  const keyInfo = keyRotationManager.getNextKey();
  if (!keyInfo) throw new Error('Svi API ključevi iskorišteni.');

  const { key, index } = keyInfo;

  const langInstruction: Record<string, string> = {
    bs: 'Odgovaraj na bosanskom jeziku.',
    de: 'Antworte auf Deutsch.',
    en: 'Respond in English.',
  };

  const systemText = `${promptContext}

You are continuing a conversation about an already-generated
educational document. The user wants to refine, expand, or
modify the content.

${langInstruction[detectedLang] ?? langInstruction.bs}

RULES:
- If user asks to modify content: provide the modified section
  in the same HTML format as the original
- If user asks a question: answer thoroughly and academically
- If user asks for additional content: generate it at the
  same high quality level as the original document
- Always maintain the IDSS branding context
- Never produce generic responses`;

  const messages: GeminiMessage[] = [
    {
      role:  'user',
      parts: [{
        text: `Here is the document we are refining:\n\n${originalContent.slice(0, 8000)}\n\n---\nUser message: ${userMessage}`
      }],
    },
    ...chatHistory.slice(-6).map((msg) => ({
      role:  msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    })),
  ];

  const body: GeminiRequest = {
    contents: messages,
    systemInstruction: {
      parts: [{ text: systemText }],
    },
    generationConfig: {
      temperature:     0.60,
      maxOutputTokens: 8192,
      topP:            0.95,
      topK:            40,
    },
  };

  if (onChunk) {
    const result = await streamGeneration(body, key, index, onChunk, Date.now());
    return result.content;
  }

  const result = await standardGeneration(body, key, index, Date.now());
  return result.content;
}
