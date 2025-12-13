import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationData, NarrativeData, PromptRequestForm } from "../types";

// Initialize the Google GenAI SDK
// API Key must be set in your environment variables (e.g. .env.local)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Streams content generation for the main document editor.
 * Uses gemini-3-pro-preview by default for complex reasoning.
 */
export const streamContent = async (
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  onChunk: (text: string) => void
) => {
  try {
    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: systemInstruction,
        // Note: For gemini-3-pro-preview (thinking model), do NOT set thinkingBudget to 0.
        // Leaving it undefined allows the model to use its default thinking behavior.
      },
    });

    const result = await chat.sendMessageStream({ message: userPrompt });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error streaming content:", error);
    throw error;
  }
};

/**
 * Handles follow-up chat messages that are context-aware of the generated content.
 * Reconstructs the conversation history for stateless interaction.
 */
export const sendChatFollowUp = async (
  modelName: string,
  contextContent: string,
  history: { role: 'user' | 'model', text: string }[],
  newMessage: string,
  customSystemInstruction?: string
): Promise<string> => {
  try {
    // We construct a chat session that knows about the document context
    // Ideally, we would persist the 'chat' object, but for this stateless service architecture,
    // we recreate the context in the system instruction and pass previous history.
    
    const defaultInstruction = `You are a highly capable AI educational consultant and writing assistant. 
        
    The user has generated the following educational content: 
    ---
    ${contextContent.substring(0, 25000)}
    ---
    
    Your goal is to help the user refine, expand, or understand this content.
    
    GUIDELINES FOR RESPONSE:
    1. **Clarity & Conciseness**: Be direct and clear. Avoid fluff. Get straight to the pedagogical point while ensuring the explanation is complete.
    2. **Depth where needed**: While being concise, do not sacrifice necessary detail for complex questions. Explain your reasoning briefly.
    3. **Context Awareness**: Reference specific parts of the content above in your answers.
    4. **Professional Tone**: Maintain an academic or professional tone suitable for educators.
    5. **Structure**: Use paragraphs, lists, and clear spacing to make your response readable.
    
    STRICT FORMATTING RULE:
    Output purely in plain text. Do NOT use Markdown (no **, #, []) or HTML tags. 
    Format your response as if writing a standard professional email or document using only spacing and capitalization for structure.`;

    // Use the custom instruction if provided, but still inject the content context
    const instructionToUse = customSystemInstruction 
      ? `${customSystemInstruction}\n\nCONTEXT CONTENT:\n${contextContent.substring(0, 25000)}`
      : defaultInstruction;

    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: instructionToUse
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat follow-up error:", error);
    throw error;
  }
};

/**
 * Generates an executive summary and a visual illustration for the content.
 * Uses gemini-2.5-flash for text summary and gemini-2.5-flash-image for image generation.
 */
export const generateNarrativeAssets = async (content: string): Promise<NarrativeData> => {
  // 1. Generate Summary and Key Takeaways
  const summaryResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze the following educational content and provide a brief executive summary (max 3 sentences) and 3-5 key takeaways.
    
    Content:
    ${content.substring(0, 15000)}`, // Truncate to save tokens if extremely long
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "keyTakeaways"]
      }
    }
  });

  const textData = JSON.parse(summaryResponse.text || '{}');

  // 2. Generate Illustration using Gemini Image capabilities
  // Create a visual prompt based on the summary
  const imagePrompt = `Create a high-quality, modern, flat-design educational illustration that visually represents this concept: "${textData.summary}". 
  Style: Professional vector art, clean lines, vibrant but professional colors (blues, teals, oranges). 
  Context: Suitable for a school presentation, textbook, or educational material. Minimalist and clear. No text in the image.`;
  
  let imageUrl = undefined;
  try {
     const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: imagePrompt }] },
        config: {
            imageConfig: {
                aspectRatio: "16:9",
            }
        }
     });

     // Extract image from response
     for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
        }
     }
  } catch (e) {
      console.warn("Image generation failed", e);
      // We don't throw here to ensure the summary is still returned even if the image fails
  }

  return {
    summary: textData.summary || "No summary available.",
    keyTakeaways: textData.keyTakeaways || [],
    imageUrl
  };
};

/**
 * Evaluates the pedagogical quality of the content.
 * Returns structured data including scores and feedback.
 */
export const evaluatePedagogy = async (content: string): Promise<EvaluationData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Evaluate the following educational content based on pedagogical standards.
        Provide scores from 0 to 100 for Clarity, Relevance, Engagement, and Inclusivity.
        Provide a brief feedback paragraph and a list of specific improvement suggestions.

        Content:
        ${content.substring(0, 15000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    scores: {
                        type: Type.OBJECT,
                        properties: {
                            clarity: { type: Type.INTEGER },
                            relevance: { type: Type.INTEGER },
                            engagement: { type: Type.INTEGER },
                            inclusivity: { type: Type.INTEGER }
                        }
                    },
                    feedback: { type: Type.STRING },
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    return JSON.parse(response.text || '{}');
};

/**
 * Takes a user's prompt request form and architects a valid JSON PromptDefinition.
 * This effectively acts as an AI Developer creating new tools.
 */
export const architectPromptFromRequest = async (request: PromptRequestForm): Promise<string> => {
    const systemInstruction = `You are a Senior Prompt Engineer and System Architect.
    Your task is to take a raw feature request for a new AI tool and convert it into a strictly structured JSON object 
    that matches the 'PromptDefinition' interface used in our application.

    The user input might be in Bosnian or English. You MUST output the final JSON content in ENGLISH.

    The 'PromptDefinition' interface structure is:
    {
      id: string; // unique-kebab-case-id
      title: string; // Clear, short title
      category: string; // Suggest a category (e.g., "Planning", "Assessment", "Administrative")
      description: string; // 1 sentence description + Example Usage string
      icon: string; // Choose the most appropriate Lucide React icon name (e.g. "BookOpen", "Brain", "PenTool", "Calculator", "Users", "Calendar", "FileText")
      fields: [ // Array of input fields the user needs to fill out
         { 
           key: string; 
           label: string; 
           type: 'text' | 'textarea' | 'select' | 'number';
           options?: string[]; // Only for 'select' type
           placeholder?: string;
         }
      ];
      systemInstruction: string; // The high-quality metaprompt that instructs the AI how to behave based on the user's requirements.
    }

    CRITICAL INSTRUCTION FOR 'systemInstruction' field:
    - This must be a highly detailed, professional prompt.
    - It must incorporate the user's requested Tone, Style, Constraints, and Role.
    - It must strictly enforce the output format requested (e.g. "No Markdown", "JSON only", etc).
    
    Output ONLY the valid JSON object. No markdown code fences.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User Request Data:
        Project Title: ${request.projectTitle}
        Goal: ${request.primaryGoal}
        Task: ${request.specificTask}
        Inputs Provided by User: ${request.userInputs}
        Desired Output: ${request.outputStructure}
        Tone/Style: ${request.toneStyle}
        Constraints: ${request.keywords} ${request.avoidTopics}
        Persona: ${request.rolePersona}
        
        Generate the JSON definition now.`,
        config: {
            responseMimeType: "application/json"
        }
    });

    return response.text || "{}";
};