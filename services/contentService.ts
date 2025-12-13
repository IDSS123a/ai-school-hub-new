
import { GeneratedContent, SavedTemplate, ChatMessage } from '../types';

// --- CONTENT MANAGEMENT (LocalStorage Implementation) ---

export const saveGeneratedContent = async (userId: string, content: Partial<GeneratedContent>) => {
  try {
    const key = `generated_content_${userId}`;
    let existing: GeneratedContent[] = [];
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
             const parsed = JSON.parse(stored);
             if (Array.isArray(parsed)) existing = parsed;
        }
    } catch(err) {
        console.warn("Resetting corrupted generated content storage");
        existing = [];
    }

    // We can safely cast here because we ensure the required fields are added
    const newDoc = {
      id: Date.now().toString(),
      ...content,
      userId,
      createdAt: Date.now(),
    } as GeneratedContent;
    
    // Limit history to 50 items to prevent overflow
    if (existing.length >= 50) {
        existing = existing.slice(0, 49);
    }
    
    existing.unshift(newDoc); // Add to beginning
    
    try {
        localStorage.setItem(key, JSON.stringify(existing));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error("Local storage quota exceeded. Clearing old data.");
            // Drastic measure: Keep only last 5
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 5)));
        } else {
            throw e;
        }
    }
    return newDoc.id;
  } catch (e: any) {
    console.error("Error saving generated content locally: ", e);
    return null; 
  }
};

export const getUserHistory = async (userId: string) => {
  try {
    const key = `generated_content_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    try {
        const existing = JSON.parse(stored);
        return Array.isArray(existing) ? existing : [];
    } catch {
        return [];
    }
  } catch (e) {
    console.error("Error fetching local history: ", e);
    return [];
  }
};

// --- TEMPLATE MANAGEMENT (LocalStorage Implementation) ---

export const saveTemplate = async (userId: string, template: Omit<SavedTemplate, 'id' | 'createdAt'>) => {
  try {
    const key = `saved_templates_${userId}`;
    let existing: SavedTemplate[] = [];
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
             const parsed = JSON.parse(stored);
             if (Array.isArray(parsed)) existing = parsed;
        }
    } catch (err) {
        console.warn("Resetting corrupted template storage");
        existing = [];
    }
    
    const newTemplate = { 
        ...template, 
        id: Date.now().toString(), 
        createdAt: Date.now() 
    };
    
    existing.push(newTemplate);
    try {
        localStorage.setItem(key, JSON.stringify(existing));
    } catch (e: any) {
         if (e.name === 'QuotaExceededError' || e.code === 22) {
             console.error("Storage full for templates");
             return null;
         }
    }
    return newTemplate.id;
  } catch (e) {
    console.error("Error saving template locally", e);
    return null;
  }
};

export const getTemplates = async (userId: string): Promise<SavedTemplate[]> => {
  try {
      const key = `saved_templates_${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      
      try {
          const templates = JSON.parse(stored);
          if (!Array.isArray(templates)) return [];
          return templates.sort((a: SavedTemplate, b: SavedTemplate) => b.createdAt - a.createdAt);
      } catch {
          return [];
      }
  } catch (e) {
      console.error("Error loading local templates", e);
      return [];
  }
};

export const deleteTemplate = async (templateId: string) => {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('saved_templates_')) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    try {
                        const templates = JSON.parse(stored);
                        if (Array.isArray(templates)) {
                            const newTemplates = templates.filter((t: SavedTemplate) => t.id !== templateId);
                            if (templates.length !== newTemplates.length) {
                                localStorage.setItem(key, JSON.stringify(newTemplates));
                                return;
                            }
                        }
                    } catch {
                        continue;
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error deleting template", e);
    }
};

// --- CHAT SESSION MANAGEMENT (LocalStorage Implementation) ---

export const saveChatSession = async (userId: string, promptId: string, messages: ChatMessage[]) => {
  try {
    const key = `chat_history_${userId}_${promptId}`;
    try {
        localStorage.setItem(key, JSON.stringify(messages));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
             // If chat is too long, keep last 20 messages
             const truncated = messages.slice(-20);
             localStorage.setItem(key, JSON.stringify(truncated));
        }
    }
  } catch (e) {
    console.error("Error saving chat session:", e);
  }
};

export const getChatSession = async (userId: string, promptId: string): Promise<ChatMessage[]> => {
  try {
    const key = `chat_history_${userId}_${promptId}`;
    const local = localStorage.getItem(key);
    
    if (local) {
        try {
            const parsed = JSON.parse(local);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
  } catch (e) {
    console.error("Error loading chat session:", e);
    return [];
  }
};
