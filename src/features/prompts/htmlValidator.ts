// ===== FILE: /src/features/prompts/htmlValidator.ts =====
import { ValidationResult } from '../../types/v6-prompt.schema';

export function validatePlatinumHTML(
  html: string,
  config: { requiredSections: string[]; font: string }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const autoFixesApplied: string[] = [];

  // 1. Strip Markdown Artifacts
  let cleanHtml = html
    .replace(/```html|```/gi, '')
    .replace(/\*\*|__/g, '')
    .replace(/^#{1,6}\s/gm, '')
    .trim();

  // SSR Safety Check
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return { isValid: true, html: cleanHtml, errors: [], warnings: ['DOMParser unavailable (SSR)'], autoFixesApplied: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');

  // 2. Structural Validation
  config.requiredSections.forEach((section) => {
    const hasSection = 
      doc.querySelector(`[data-section="${section}"]`) || 
      doc.body.innerHTML.toLowerCase().includes(section.toLowerCase());
    
    if (!hasSection) {
      errors.push(`Missing required section: ${section}`);
    }
  });

  // 3. Font Compliance & Root Wrapping
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (root) {
    const styleAttr = root.getAttribute('style') || '';
    if (!styleAttr.toLowerCase().includes(config.font.toLowerCase())) {
      root.style.fontFamily = `'${config.font}', sans-serif`;
      autoFixesApplied.push(`Injected font-family: ${config.font} on root element`);
    }
  } else {
    cleanHtml = `<div style="font-family: '${config.font}', sans-serif;">${cleanHtml}</div>`;
    autoFixesApplied.push(`Wrapped content in root div with ${config.font}`);
    return validatePlatinumHTML(cleanHtml, config); // Re-parse wrapped content
  }

  // 4. Heading Hierarchy Normalization
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  headings.forEach((h, idx) => {
    if (h.tagName === 'H1' && idx > 0) {
      const h2 = doc.createElement('h2');
      h2.innerHTML = h.innerHTML;
      h.replaceWith(h2);
      autoFixesApplied.push('Normalized nested H1 to H2');
    }
  });

  return {
    isValid: errors.length === 0,
    html: doc.body.innerHTML,
    errors,
    warnings,
    autoFixesApplied
  };
}