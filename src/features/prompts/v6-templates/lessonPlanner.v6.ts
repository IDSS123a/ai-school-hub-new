// ═══════════════════════════════════════════════════════
// Lesson Planner V6 Template — JSON Structure
// ═══════════════════════════════════════════════════════

import { V6PromptTemplate } from '../../../types/v6-prompt.schema';

export const lessonPlannerV6Template: V6PromptTemplate = {
  name: "Lesson Planner",
  version: "6.0",
  sections: [
    {
      id: "header",
      title: "Document Header",
      content: "<h1>Lesson Plan: {{formData.topic}}</h1><p>Grade: {{formData.grade}} | Subject: {{formData.subject}}</p>",
      required: true
    },
    {
      id: "objectives",
      title: "Learning Objectives",
      content: "<h2>Learning Objectives</h2><ul><li>Students will be able to...</li></ul>",
      required: true
    },
    {
      id: "activities",
      title: "Lesson Activities",
      content: "<h2>Activities</h2><ol><li>Introduction (5 min)</li><li>Main Activity (30 min)</li><li>Conclusion (10 min)</li></ol>",
      required: true
    },
    {
      id: "assessment",
      title: "Assessment",
      content: "<h2>Assessment</h2><p>How will learning be measured?</p>",
      required: false
    }
  ],
  metadata: {
    author: "IDSS Pedagogical Team",
    lastUpdated: "2026-04-10"
  }
};

/**
 * Helper to compile the V6 template into a system prompt string
 */
export function compileV6Prompt(template: V6PromptTemplate, language: string): string {
  const langPrompt = language === 'de' 
    ? "Bitte erstellen Sie den Unterrichtsplan auf Deutsch." 
    : language === 'en' 
    ? "Please create the lesson plan in English." 
    : "Molim vas kreirajte plan časa na bosanskom jeziku.";

  const sectionsText = template.sections
    .map(s => `### ${s.title}\n${s.content}`)
    .join('\n\n');

  return `
    You are an expert pedagogical assistant. 
    ${langPrompt}
    
    Structure the document with the following sections:
    ${sectionsText}
    
    Use professional HTML formatting. Do not include <html> or <body> tags.
  `;
}
