
{
  "project_metadata": {
    "name": "AI School Hub",
    "repository_url": "https://github.com/IDSS123a/ai-school-hub-new",
    "version": "1.0.0",
    "type": "Single Page Application (SPA)"
  },
  "executive_summary": {
    "purpose": "AI School Hub is an enterprise-grade, AI-powered educational platform designed to streamline administrative and pedagogical tasks. It utilizes Google's Gemini API to generate lesson plans, event schedules, grant proposals, and educational visuals, while providing tools for real-time collaboration and user management.",
    "target_audience": [
      "Teachers (Lesson planning, material generation)",
      "School Administrators (Policy memos, event planning)",
      "Directors (Strategic planning, analytics)",
      "Counselors (Expert consultation logs)",
      "Secretaries (Communication drafts)"
    ]
  },
  "technical_architecture": {
    "languages": [
      "TypeScript (Logic & Typing)",
      "TSX (React Components)",
      "HTML5 (Structure)",
      "CSS3 (via Tailwind)"
    ],
    "frameworks_and_libraries": {
      "core": "React 18",
      "bundler_environment": "ES Modules (via browser native imports/ESM.sh)",
      "styling": "Tailwind CSS (CDN loaded with custom config)",
      "icons": "Lucide React",
      "charts": "Recharts",
      "rich_text_editor": "Quill.js",
      "ai_integration": "@google/genai SDK",
      "export_tools": "html2pdf.js, html-docx-js-typescript"
    },
    "programming_techniques": {
      "state_management": "React useState, useContext (ToastProvider), and useRef",
      "service_layer_pattern": "API calls and logic encapsulated in 'services/' directory",
      "streaming_responses": "Handling chunked data from Gemini API for real-time text generation",
      "mock_backend": "LocalStorage used to simulate Database persistence (User history, Admin DB)",
      "event_driven_architecture": "BroadcastChannel API used for cross-tab 'real-time' collaboration simulation",
      "responsive_design": "Mobile-first approach with collapsible sidebars and responsive grids",
      "error_handling": "React Error Boundaries and try/catch blocks in async services"
    }
  },
  "design_system": {
    "ui_ux_philosophy": "Clean, enterprise professional aesthetic with focus on readability and accessibility. Uses a split-pane interface for the editor (Input Panel vs. Preview/Chat Panel).",
    "color_palette": {
      "base_colors": {
        "primary": "#FFCB29 (Yellow/Gold)",
        "secondary": "#08ABE6 (Cyan/Light Blue)",
        "accent": "#035EA1 (Dark Blue)"
      },
      "neutrals": "Slate (Derived from blue hues for cohesion)",
      "semantic_mapping": {
        "success": "Mapped to Secondary variants (Cyan)",
        "error": "Mapped to Accent variants (Dark Blue/Red override)",
        "warning": "Mapped to Primary variants (Yellow)"
      }
    },
    "theming": {
      "mechanism": "Tailwind 'class' strategy (Light/Dark mode)",
      "implementation": "Global CSS variables for root colors, strict Tailwind config overrides in index.html"
    }
  },
  "project_tree": {
    "root": [
      "index.html (Entry point, contains global Tailwind config and CSS)",
      "index.tsx (React mount point)",
      "App.tsx (Main router and layout shell)",
      "types.ts (TypeScript interfaces and Enums)",
      "metadata.json (Project configuration)",
      "README.md (This file)"
    ],
    "components": [
      "Login.tsx (Authentication screen with aesthetic background)",
      "Dashboard.tsx (Main landing view with tool grid and activity feed)",
      "EditorLayout.tsx (Core workspace container)",
      "AdminPanel.tsx (User management table and analytics)",
      "SettingsModal.tsx (Theme, language, and account settings)",
      "NewPromptModal.tsx (Form to request new AI tools)",
      "ShareModal.tsx (Collaboration invite UI)",
      "ErrorBoundary.tsx (React error catcher)"
    ],
    "components_editor": [
      "FormPanel.tsx (Dynamic input fields based on PromptDefinition)",
      "PreviewPanel.tsx (Renders generated content, visualizations, and analytics)",
      "ChatPanel.tsx (Context-aware chat interface with the AI)"
    ],
    "context": [
      "ToastContext.tsx (Global notification system)"
    ],
    "services": [
      "geminiService.ts (Google AI integration, streaming, image generation)",
      "firebase.ts (Mocked authentication layer)",
      "adminService.ts (Mocked user database and admin logic)",
      "contentService.ts (LocalStorage wrapper for saving docs/templates)",
      "collaborationService.ts (BroadcastChannel logic for sync)",
      "mockDatabase.ts (Static definitions for Prompts and Announcements)"
    ]
  },
  "reconstruction_instructions": "To rebuild this application, an AI agent must: 1. Preserve the file structure exactly as listed. 2. Ensure 'index.html' includes the specific <script> block defining the 'palette' object and 'tailwind.config' overrides. 3. Do not introduce external node_modules; usage must rely on the ES Modules import map defined in index.html. 4. Maintain the strict separation of concerns between UI components and the 'services/' layer. 5. Ensure all colors use the 'primary', 'secondary', and 'accent' utility classes provided by the custom Tailwind config."
}
