{
  "project_metadata": {
    "name": "AI School Hub",
    "repository_url": "https://github.com/IDSS123a/ai-school-hub-new",
    "version": "1.0.0",
    "application_type": "Single Page Application (SPA)",
    "execution_target": "Modern evergreen browsers",
    "rebuild_mode": "Full deterministic rebuild from scratch with complete functional and visual parity"
  },

  "ai_role_definition": {
    "persona": "Senior Principal Software Engineer and UI Architect with 30+ years of experience",
    "mandate": "Rebuild the entire application independently using production-grade standards and strict adherence to this specification",
    "non_negotiables": [
      "No assumptions beyond this document",
      "No simplifications",
      "No deviations in architecture, theming, or behavior"
    ]
  },

  "executive_summary": {
    "purpose": "AI School Hub is an enterprise-grade, AI-powered educational productivity platform designed to centralize pedagogical content generation, administrative workflows, and school-wide collaboration without a traditional backend.",
    "primary_objectives": [
      "Streamline educational and administrative workflows",
      "Standardize AI-assisted content generation",
      "Simulate real-time collaboration using browser-native APIs",
      "Provide a professional, minimal, distraction-free workspace"
    ],
    "target_roles": {
      "teacher": "Lesson plans, worksheets, teaching materials",
      "administrator": "Policies, announcements, schedules",
      "director": "Strategic planning and summaries",
      "counselor": "Consultation documentation",
      "secretary": "Official communication drafts"
    }
  },

  "technical_architecture": {
    "language_stack": [
      "TypeScript (strict typing)",
      "React TSX",
      "HTML5",
      "CSS3"
    ],
    "runtime_environment": {
      "module_system": "Native ES Modules",
      "bundler": "None",
      "dependency_loading": "ESM.sh CDN imports defined directly in index.html"
    },
    "frameworks_and_libraries": {
      "ui_framework": "React 18",
      "styling": "Tailwind CSS via CDN with inline tailwind.config",
      "icons": "lucide-react",
      "charts": "recharts",
      "rich_text_editor": "quill",
      "ai_sdk": "@google/genai",
      "export_tools": [
        "html2pdf.js",
        "html-docx-js-typescript"
      ]
    }
  },

  "routing_and_navigation": {
    "strategy": "Conditional rendering only",
    "implementation": "Single activeTab state managed in App.tsx",
    "constraints": [
      "No React Router",
      "No URL-based routing",
      "Navigation must not trigger page reloads"
    ]
  },

  "authentication_and_roles": {
    "authentication_type": "Mocked role-based authentication",
    "implementation": {
      "service": "adminService.ts",
      "storage": "LocalStorage"
    },
    "roles": [
      "teacher",
      "administrator",
      "director",
      "counselor",
      "secretary"
    ],
    "constraints": [
      "No real authentication provider",
      "Role determines UI access and available tools"
    ]
  },

  "ai_prompt_system": {
    "prompt_definitions": "Predefined only",
    "source": "mockDatabase.ts",
    "user_capabilities": [
      "Execute existing AI tools",
      "Request new tools via NewPromptModal"
    ],
    "restrictions": [
      "Users cannot create executable prompts dynamically",
      "New prompt requests are non-functional submissions only"
    ]
  },

  "state_and_data_model": {
    "state_management": [
      "React useState",
      "React useContext (ToastContext only)",
      "React useRef where direct DOM interaction is required"
    ],
    "persistence": {
      "storage": "LocalStorage",
      "domains": [
        "User sessions",
        "Generated content",
        "Prompt history",
        "Admin records"
      ]
    },
    "real_time_collaboration": {
      "mechanism": "BroadcastChannel API",
      "scope": [
        "Chat synchronization",
        "Editor presence",
        "Document updates"
      ],
      "limitations": "Same-origin, same-browser simulation only"
    }
  },

  "design_system": {
    "ui_philosophy": [
      "Enterprise-grade minimalism",
      "High readability",
      "Low cognitive load",
      "Clear visual hierarchy per component"
    ],
    "color_system": {
      "base_colors": {
        "primary": "#FFCB29",
        "secondary": "#08ABE6",
        "accent": "#035EA1"
      },
      "rules": [
        "No hardcoded colors anywhere in the codebase",
        "All colors must be derived from base colors",
        "Opacity and brightness variants are allowed",
        "Light Mode and Dark Mode must be fully preserved"
      ]
    },
    "theming": {
      "strategy": "Tailwind class-based theming",
      "selectors": {
        "light": ":root, [data-theme='light']",
        "dark": ".dark, [data-theme='dark']"
      },
      "requirements": [
        "Instant global theme switching",
        "No visual regressions between themes",
        "Consistent contrast across UI states"
      ]
    },
    "typography": {
      "font_family": [
        "Poppins",
        "Inter",
        "sans-serif"
      ],
      "hierarchy": "No global typographic rules; all sizing and weight handled via Tailwind utilities at component level"
    },
    "accessibility": {
      "standard": "General best practices",
      "requirements": [
        "Semantic HTML",
        "Visible focus rings",
        "Keyboard navigability"
      ]
    },
    "animations": {
      "allowed": true,
      "style": "Subtle only",
      "examples": [
        "fade-in",
        "slide",
        "hover-scale"
      ]
    }
  },

  "application_structure": {
    "root_files": [
      "index.html",
      "index.tsx",
      "App.tsx",
      "types.ts",
      "metadata.json",
      "README.md"
    ],
    "components": {
      "auth": ["Login.tsx"],
      "core": ["Dashboard.tsx", "EditorLayout.tsx"],
      "admin": ["AdminPanel.tsx"],
      "modals": [
        "SettingsModal.tsx",
        "NewPromptModal.tsx",
        "ShareModal.tsx"
      ],
      "infrastructure": ["ErrorBoundary.tsx"]
    },
    "editor_components": [
      "FormPanel.tsx",
      "PreviewPanel.tsx",
      "ChatPanel.tsx"
    ],
    "context": ["ToastContext.tsx"],
    "services": [
      "geminiService.ts",
      "firebase.ts",
      "adminService.ts",
      "contentService.ts",
      "collaborationService.ts",
      "mockDatabase.ts"
    ]
  },

  "rebuild_execution_order": [
    "Create index.html with Tailwind CDN, font imports, and inline tailwind.config",
    "Define global CSS variables for theme tokens",
    "Implement index.tsx React mount",
    "Implement App.tsx layout shell and activeTab logic",
    "Build core UI components",
    "Implement editor subsystem",
    "Implement services layer",
    "Wire context providers and error boundaries",
    "Validate Light/Dark theme parity",
    "Perform final functional and visual audit"
  ],

  "hard_constraints": {
    "no_node_environment": true,
    "no_backend_services": true,
    "no_external_css_files": true,
    "no_unapproved_dependencies": true,
    "no_color_deviations": true,
    "no_router_library": true
  },

  "quality_gates": {
    "code_quality": [
      "Strict TypeScript typing",
      "No unused variables",
      "Clear separation of concerns"
    ],
    "ui_quality": [
      "Consistent spacing",
      "Responsive layouts",
      "No layout shifts or visual artifacts"
    ],
    "functional_quality": [
      "All AI tools produce output",
      "Streaming AI responses function correctly",
      "Theme switching applies globally"
    ]
  },

  "completion_criteria": {
    "functional_parity": "100%",
    "visual_parity": "100%",
    "theme_integrity": "100%",
    "architectural_compliance": "Mandatory"
  }
}