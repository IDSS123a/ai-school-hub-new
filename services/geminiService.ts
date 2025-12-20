
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationData, NarrativeData, PromptRequestForm, GroundingMetadata } from "../types";

// Initialize the Google GenAI SDK
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Streams content generation for the main document editor.
 */
export const streamContent = async (
  modelName: string,
  systemInstruction: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  onMetadata?: (metadata: GroundingMetadata) => void
) => {
  try {
    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleSearch: {}}],
      },
    });

    const result = await chat.sendMessageStream({ message: userPrompt });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
      if (chunk.candidates?.[0]?.groundingMetadata && onMetadata) {
        onMetadata(chunk.candidates[0].groundingMetadata as GroundingMetadata);
      }
    }
  } catch (error) {
    console.error("Error streaming content:", error);
    throw error;
  }
};

/**
 * Handles follow-up chat messages with optional multi-modal file context.
 */
export const sendChatFollowUp = async (
  modelName: string,
  contextContent: string,
  history: { role: 'user' | 'model', text: string }[],
  newMessage: string,
  customSystemInstruction?: string,
  fileAttachment?: { data: string; mimeType: string }
): Promise<{ text: string, groundingMetadata?: GroundingMetadata }> => {
  try {
    const defaultInstruction = `You are a highly capable AI educational consultant and writing assistant. 
        
    The user has generated the following educational content: 
    ---
    ${contextContent.substring(0, 25000)}
    ---
    
    Your goal is to help the user refine, expand, or understand this content.
    If a file is attached, use its content as additional context for your answer.`;

    const instructionToUse = customSystemInstruction 
      ? `${customSystemInstruction}\n\nCONTEXT CONTENT:\n${contextContent.substring(0, 25000)}`
      : defaultInstruction;

    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: instructionToUse,
        tools: [{googleSearch: {}}],
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const parts: any[] = [{ text: newMessage }];
    if (fileAttachment) {
      parts.push({
        inlineData: {
          data: fileAttachment.data,
          mimeType: fileAttachment.mimeType
        }
      });
    }

    // Fix: Explicitly define the message as a Content object with parts to resolve type ambiguity
    const result = await chat.sendMessage({ message: { role: 'user', parts } });
    return {
        text: result.text || "I couldn't generate a response.",
        groundingMetadata: result.candidates?.[0]?.groundingMetadata as GroundingMetadata
    };
  } catch (error) {
    console.error("Chat follow-up error:", error);
    throw error;
  }
};

/**
 * Generates an executive summary and a visual illustration for the content.
 */
export const generateNarrativeAssets = async (content: string): Promise<NarrativeData> => {
  // Fix: Upgraded model to gemini-3-flash-preview for basic text summarization tasks
  const summaryResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following educational content and provide a brief executive summary (max 3 sentences) and 3-5 key takeaways.
    
    Content:
    ${content.substring(0, 15000)}`,
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

  const imagePrompt = `Create a high-quality, modern, flat-design educational illustration that visually represents this concept: "${textData.summary}". 
  Style: Professional vector art, clean lines, vibrant but professional colors. No text.`;
  
  let imageUrl = undefined;
  try {
     // Fix: Use the standard Content object structure { parts: [...] } to resolve line 91 'parts' type error
     const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: imagePrompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: "16:9",
            }
        }
     });

     for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
        }
     }
  } catch (e) {
      console.warn("Image generation failed", e);
  }

  return {
    summary: textData.summary || "No summary available.",
    keyTakeaways: textData.keyTakeaways || [],
    imageUrl
  };
};

/**
 * Evaluates the pedagogical quality of the content.
 */
export const evaluatePedagogy = async (content: string): Promise<EvaluationData> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Evaluate the following educational content based on pedagogical standards.
        Provide scores from 0 to 100 for Clarity, Relevance, Engagement, and Inclusivity.
        Provide feedback and improvement suggestions.

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
 * Architect a valid JSON PromptDefinition from a user request.
 */
export const architectPromptFromRequest = async (request: PromptRequestForm): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `User Request Data:
        Project Title: ${request.projectTitle}
        Goal: ${request.primaryGoal}
        Task: ${request.specificTask}
        Inputs: ${request.userInputs}
        Output: ${request.outputStructure}
        Tone: ${request.toneStyle}
        Persona: ${request.rolePersona}
        
        Generate a JSON PromptDefinition for this request.`,
        config: {
            responseMimeType: "application/json"
        }
    });

    return response.text || "{}";
};
