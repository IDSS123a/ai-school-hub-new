import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Tailwind class merger ────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatters ──────────────────────────────────────
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Upravo sada';
  if (diff < 3600) return `Prije ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Prije ${Math.floor(diff / 3600)} sat${Math.floor(diff / 3600) > 1 ? 'a' : ''}`;
  if (diff < 604800) return `Prije ${Math.floor(diff / 86400)} dan${Math.floor(diff / 86400) > 1 ? 'a' : ''}`;
  return formatDate(date);
}

export function formatDate(date: string | Date, fmt?: string): string {
  const d = new Date(date);
  if (fmt === 'time') {
    return d.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('bs-BA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('bs-BA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── String helpers ───────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

// ─── Role display helpers ─────────────────────────────────
export const ROLE_LABELS: Record<string, string> = {
  admin:   'Administrator',
  teacher: 'Nastavnik',
  staff:   'Osoblje',
};

export const STAFF_SUB_ROLE_LABELS: Record<string, string> = {
  secretary:    'Sekretar',
  pedagogue:    'Pedagog',
  psychologist: 'Psiholog',
  board_member: 'Član odbora',
  director:     'Direktor',
};

export function getRoleLabel(role: string, subRole?: string | null): string {
  if (role === 'staff' && subRole) {
    return STAFF_SUB_ROLE_LABELS[subRole] ?? ROLE_LABELS[role];
  }
  return ROLE_LABELS[role] ?? role;
}

// ─── Color helpers for collaboration cursors ──────────────
const CURSOR_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#0891B2', '#65A30D', '#C026D3',
];

export function getCursorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

// ─── Number formatters ────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ─── Greeting helper ─────────────────────────────────────
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Dobro jutro';
  if (hour < 18) return 'Dobar dan';
  return 'Dobra večer';
}
