
{
  "project_metadata": {
    "name": "AI School Hub",
    "description": "Enterprise-grade AI-powered education platform for teachers and administrators.",
    "version": "1.1.0",
    "type": "Single Page Application (SPA)",
    "execution_environment": "Browser (No Build Step / Native ES Modules)"
  },
  "executive_summary": {
    "purpose": "Centralize educational workflows using Google Gemini AI, featuring advanced multi-modal chat support.",
    "target_audience": [
      "Teachers",
      "Administrators",
      "Directors",
      "Counselors",
      "Secretaries"
    ],
    "core_features": [
      "Role-based access control",
      "AI content generation with streaming",
      "Real-time collaboration simulation",
      "Multi-modal chat (supports PDF/TXT/Image uploads for context)",
      "Document export (PDF, DOCX, HTML)"
    ]
  },
  "technical_architecture": {
    "stack": {
      "language": "TypeScript / TSX",
      "framework": "React 18",
      "styling": "Tailwind CSS (CDN)",
      "icons": "Lucide React",
      "ai_sdk": "@google/genai",
      "charts": "Recharts",
      "rich_text": "Quill.js"
    },
    "dependency_management": {
      "method": "Import Map (ESM.sh)",
      "imports": {
        "react": "https://esm.sh/react@18.3.1",
        "react-dom": "https://esm.sh/react-dom@18.3.1",
        "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
        "@google/genai": "https://esm.sh/@google/genai",
        "lucide-react": "https://esm.sh/lucide-react@0.358.0",
        "recharts": "https://esm.sh/recharts@2.12.3?external=react,react-dom",
        "html-docx-js-typescript": "https://esm.sh/html-docx-js-typescript@0.1.5"
      }
    },
    "data_persistence": "LocalStorage (Mock DB, User History, Auto-saves, Chat Session)",
    "routing": "Conditional Rendering (No React Router)"
  },
  "design_system": {
    "palette": {
      "primary": "#FFCB29",
      "secondary": "#08ABE6",
      "accent": "#035EA1",
      "neutrals": "Slate"
    },
    "typography": {
      "font_family": "Poppins, Inter, sans-serif"
    },
    "ui_components": {
      "login_screen": "Split layout.",
      "dashboard": "Grid layout.",
      "editor": "Three-pane layout with resizable sidebars."
    }
  },
  "file_structure_instructions": {
    "root": {
      "index.html": "Entry point with custom Tailwind config and palette.",
      "index.tsx": "React mount.",
      "App.tsx": "Router and layout shell.",
      "types.ts": "Shared interfaces.",
      "metadata.json": "Standard metadata."
    },
    "components": {
      "Login.tsx": "Auth UI.",
      "Dashboard.tsx": "Tool grid and announcements.",
      "EditorLayout.tsx": "Main workspace.",
      "AdminPanel.tsx": "User management.",
      "SettingsModal.tsx": "App configuration.",
      "NewPromptModal.tsx": "Prompt engineering request form.",
      "ShareModal.tsx": "Collaboration UI."
    },
    "components_editor": {
      "FormPanel.tsx": "Dynamic inputs with auto-save logic.",
      "PreviewPanel.tsx": "Renders Quill editor, visuals, and analytics.",
      "ChatPanel.tsx": "Context-aware chat with file upload support."
    },
    "services": {
      "geminiService.ts": "Multi-modal AI integration using @google/genai.",
      "adminService.ts": "Mock user database logic.",
      "contentService.ts": "LocalStorage persistence.",
      "collaborationService.ts": "BroadcastChannel sync logic."
    }
  },
  "specific_logic_requirements": {
    "multi_modal_chat": {
      "implementation": "ChatPanel.tsx supports FileReader for converting files to base64. sendChatFollowUp in geminiService.ts handles inlineData parts for PDFs and Images."
    }
  }
}
