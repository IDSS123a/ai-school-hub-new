// ═══════════════════════════════════════════════════════
// Language Store — BS (Bosnian) | DE (German) | EN (English)
// Persisted to localStorage
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppLanguage = 'bs' | 'de' | 'en';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'bs', // default: Bosnian
      setLanguage: (language) => set({ language }),
    }),
    { name: 'ash-language' }
  )
);

// ─── UI translations ──────────────────────────────────────
export const UI_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  bs: {
    // Dashboard
    'greeting.morning':    'Dobro jutro',
    'greeting.afternoon':  'Dobar dan',
    'greeting.evening':    'Dobra večer',
    'dashboard.title':     'Početna',
    'dashboard.newDoc':    'Novi dokument',
    'dashboard.aiTools':   'AI Alati',
    'dashboard.activity':  'Nedavna aktivnost',
    'dashboard.noActivity':'Nema nedavne aktivnosti',
    // Groups
    'group.planning':      'Planiranje nastave',
    'group.organization':  'Organizacija',
    'group.communication': 'Komunikacija',
    'group.resources':     'Resursi',
    'group.administration':'Administracija',
    // Editor
    'editor.enterData':    'Unesite podatke',
    'editor.generate':     'Generiraj sadržaj',
    'editor.generating':   'Generiranje...',
    'editor.outputHere':   'Izlaz će se pojaviti ovdje',
    'editor.fillForm':     'Popunite formu i kliknite "Generiraj sadržaj"',
    'editor.done':         'Generiranje završeno',
    'editor.save':         'Sačuvaj',
    'editor.saving':       'Čuvanje...',
    'editor.saved':        'Sačuvano',
    'editor.required':     'Obavezna polja',
    'editor.share':        'Podijeli',
    'editor.chat':         'Chat s AI',
    'editor.visuals':      'Vizuali',
    'editor.analytics':    'Analitika',
    // Protocols
    'protocol.standard':       'Standardni',
    'protocol.standard.desc':  'Brza izrada s osnovnim modulima',
    'protocol.advanced':       'Napredni',
    'protocol.advanced.desc':  'Detaljna izrada sa svim modulima',
    'protocol.collaborative':  'Kolaborativni',
    'protocol.collaborative.desc': 'Timska izrada u realnom vremenu',
    // Auth
    'auth.welcome':        'Dobrodošli nazad',
    'auth.loginSubtitle':  'Prijavite se u vaš nastavnički račun',
    'auth.email':          'Email adresa',
    'auth.password':       'Lozinka',
    'auth.forgot':         'Zaboravili ste lozinku?',
    'auth.login':          'Prijavi se',
    'auth.loggingIn':      'Prijava u toku...',
    // Nav
    'nav.dashboard':       'Početna',
    'nav.documents':       'Moji dokumenti',
    'nav.collaborations':  'Saradnja',
    'nav.users':           'Korisnici',
    'nav.prompts':         'Upravljanje promptovima',
    'nav.analytics':       'Analitika',
    'nav.profile':         'Moj profil',
    'nav.settings':        'Postavke',
    'nav.logout':          'Odjava',
    // AI Status
    'ai.active':           'Gemini 2.5 Flash · Aktivan',
    // Share
    'share.title':         'Podijeli dokument',
    'share.inviteEmail':   'Email adresa kolege',
    'share.invite':        'Pošalji pozivnicu',
    'share.sending':       'Slanje...',
    'share.sent':          'Pozivnica poslana!',
    'share.permission':    'Dozvola',
    'share.view':          'Pregled',
    'share.edit':          'Uređivanje',
    // Request prompt
    'request.title':       'Zatraži novi AI alat',
    'request.submit':      'Pošalji zahtjev',
  },

  de: {
    'greeting.morning':    'Guten Morgen',
    'greeting.afternoon':  'Guten Tag',
    'greeting.evening':    'Guten Abend',
    'dashboard.title':     'Startseite',
    'dashboard.newDoc':    'Neues Dokument',
    'dashboard.aiTools':   'KI-Werkzeuge',
    'dashboard.activity':  'Letzte Aktivität',
    'dashboard.noActivity':'Keine letzte Aktivität',
    'group.planning':      'Unterrichtsplanung',
    'group.organization':  'Organisation',
    'group.communication': 'Kommunikation',
    'group.resources':     'Ressourcen',
    'group.administration':'Verwaltung',
    'editor.enterData':    'Daten eingeben',
    'editor.generate':     'Inhalt generieren',
    'editor.generating':   'Generierung...',
    'editor.outputHere':   'Ausgabe erscheint hier',
    'editor.fillForm':     'Formular ausfüllen und auf "Inhalt generieren" klicken',
    'editor.done':         'Generierung abgeschlossen',
    'editor.save':         'Speichern',
    'editor.saving':       'Speichern...',
    'editor.saved':        'Gespeichert',
    'editor.required':     'Pflichtfelder',
    'editor.share':        'Teilen',
    'editor.chat':         'KI-Chat',
    'editor.visuals':      'Visualisierungen',
    'editor.analytics':    'Analytik',
    'protocol.standard':      'Standard',
    'protocol.standard.desc': 'Schnelle Erstellung mit Basismodulen',
    'protocol.advanced':      'Erweitert',
    'protocol.advanced.desc': 'Detaillierte Erstellung mit allen Modulen',
    'protocol.collaborative':      'Kollaborativ',
    'protocol.collaborative.desc': 'Teamerstellung in Echtzeit',
    'auth.welcome':        'Willkommen zurück',
    'auth.loginSubtitle':  'Melden Sie sich an Ihrem Lehrerkonto an',
    'auth.email':          'E-Mail-Adresse',
    'auth.password':       'Passwort',
    'auth.forgot':         'Passwort vergessen?',
    'auth.login':          'Anmelden',
    'auth.loggingIn':      'Anmeldung läuft...',
    'nav.dashboard':       'Startseite',
    'nav.documents':       'Meine Dokumente',
    'nav.collaborations':  'Zusammenarbeit',
    'nav.users':           'Benutzer',
    'nav.prompts':         'Prompt-Verwaltung',
    'nav.analytics':       'Analytik',
    'nav.profile':         'Mein Profil',
    'nav.settings':        'Einstellungen',
    'nav.logout':          'Abmelden',
    'ai.active':           'Gemini 2.5 Flash · Aktiv',
    'share.title':         'Dokument teilen',
    'share.inviteEmail':   'E-Mail-Adresse des Kollegen',
    'share.invite':        'Einladung senden',
    'share.sending':       'Wird gesendet...',
    'share.sent':          'Einladung gesendet!',
    'share.permission':    'Berechtigung',
    'share.view':          'Ansicht',
    'share.edit':          'Bearbeiten',
    'request.title':       'Neues KI-Werkzeug beantragen',
    'request.submit':      'Anfrage senden',
  },

  en: {
    'greeting.morning':    'Good morning',
    'greeting.afternoon':  'Good afternoon',
    'greeting.evening':    'Good evening',
    'dashboard.title':     'Dashboard',
    'dashboard.newDoc':    'New document',
    'dashboard.aiTools':   'AI Tools',
    'dashboard.activity':  'Recent activity',
    'dashboard.noActivity':'No recent activity',
    'group.planning':      'Lesson Planning',
    'group.organization':  'Organization',
    'group.communication': 'Communication',
    'group.resources':     'Resources',
    'group.administration':'Administration',
    'editor.enterData':    'Enter data',
    'editor.generate':     'Generate content',
    'editor.generating':   'Generating...',
    'editor.outputHere':   'Output will appear here',
    'editor.fillForm':     'Fill in the form and click "Generate content"',
    'editor.done':         'Generation complete',
    'editor.save':         'Save',
    'editor.saving':       'Saving...',
    'editor.saved':        'Saved',
    'editor.required':     'Required fields',
    'editor.share':        'Share',
    'editor.chat':         'Chat with AI',
    'editor.visuals':      'Visuals',
    'editor.analytics':    'Analytics',
    'protocol.standard':       'Standard',
    'protocol.standard.desc':  'Quick generation with basic modules',
    'protocol.advanced':       'Advanced',
    'protocol.advanced.desc':  'Detailed generation with all modules',
    'protocol.collaborative':  'Collaborative',
    'protocol.collaborative.desc': 'Team generation in real time',
    'auth.welcome':        'Welcome back',
    'auth.loginSubtitle':  'Sign in to your teacher account',
    'auth.email':          'Email address',
    'auth.password':       'Password',
    'auth.forgot':         'Forgot password?',
    'auth.login':          'Sign in',
    'auth.loggingIn':      'Signing in...',
    'nav.dashboard':       'Dashboard',
    'nav.documents':       'My documents',
    'nav.collaborations':  'Collaboration',
    'nav.users':           'Users',
    'nav.prompts':         'Prompt management',
    'nav.analytics':       'Analytics',
    'nav.profile':         'My profile',
    'nav.settings':        'Settings',
    'nav.logout':          'Sign out',
    'ai.active':           'Gemini 2.5 Flash · Active',
    'share.title':         'Share document',
    'share.inviteEmail':   'Colleague email address',
    'share.invite':        'Send invitation',
    'share.sending':       'Sending...',
    'share.sent':          'Invitation sent!',
    'share.permission':    'Permission',
    'share.view':          'View',
    'share.edit':          'Edit',
    'request.title':       'Request new AI tool',
    'request.submit':      'Submit request',
  },
};

// ─── Hook for translations ────────────────────────────────
export function useT() {
  const { language } = useLanguageStore();
  return (key: string, fallback?: string): string => {
    return UI_TRANSLATIONS[language]?.[key] ?? fallback ?? key;
  };
}
