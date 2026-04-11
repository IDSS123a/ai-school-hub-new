// ═══════════════════════════════════════════════════
// GEMINI 8-KEY ROTATION PROTOCOL
// Rotates through 8 free-tier API keys intelligently
// ═══════════════════════════════════════════════════

interface KeyState {
  key: string;
  requestsToday: number;
  errorsToday: number;
  lastUsed: number;
  isBlocked: boolean;
  blockedUntil?: number;
}

const DAILY_REQUEST_LIMIT = 1400; // Conservative limit per free-tier key (1500/day)
const MAX_ERRORS_BEFORE_SKIP = 3;
const BLOCK_DURATION_MS = 60_000; // 1 minute block after repeated errors

class GeminiKeyRotationManager {
  private keys: KeyState[];
  private currentIndex: number = 0;
  private storageKey = 'ash_gemini_key_states';

  constructor(apiKeys: string[]) {
    this.keys = this.loadState(apiKeys);
    this.scheduleDailyReset();
  }

  private loadState(apiKeys: string[]): KeyState[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed: KeyState[] = JSON.parse(stored);
        // Merge: preserve state for existing keys, add new ones
        return apiKeys.map(key => {
          const existing = parsed.find(s => s.key === key);
          return existing ?? this.createFreshKeyState(key);
        });
      }
    } catch {
      // ignore parse errors
    }
    return apiKeys.map(key => this.createFreshKeyState(key));
  }

  private createFreshKeyState(key: string): KeyState {
    return {
      key,
      requestsToday: 0,
      errorsToday: 0,
      lastUsed: 0,
      isBlocked: false,
    };
  }

  private saveState(): void {
    try {
      // Save without actual key values for security (keys come from env)
      const stateToSave = this.keys.map(({ key: _key, ...rest }) => ({
        key: _key,
        ...rest,
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
    } catch {
      // ignore storage errors
    }
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyCounts();
      // Reset every 24 hours after that
      setInterval(() => this.resetDailyCounts(), 86_400_000);
    }, msUntilMidnight);
  }

  private resetDailyCounts(): void {
    this.keys = this.keys.map(k => ({
      ...k,
      requestsToday: 0,
      errorsToday: 0,
      isBlocked: false,
      blockedUntil: undefined,
    }));
    this.saveState();
    console.info('[KeyRotation] Daily counts reset at midnight.');
  }

  private isKeyAvailable(keyState: KeyState): boolean {
    const now = Date.now();

    // Check if temporarily blocked
    if (keyState.isBlocked && keyState.blockedUntil) {
      if (now < keyState.blockedUntil) return false;
      // Block expired — unblock it
      keyState.isBlocked = false;
      keyState.blockedUntil = undefined;
      keyState.errorsToday = 0;
    }

    // Check daily limit
    if (keyState.requestsToday >= DAILY_REQUEST_LIMIT) return false;

    // Check error threshold
    if (keyState.errorsToday >= MAX_ERRORS_BEFORE_SKIP) {
      keyState.isBlocked = true;
      keyState.blockedUntil = now + BLOCK_DURATION_MS;
      return false;
    }

    return true;
  }

  getNextKey(): { key: string; index: number } | null {
    const startIndex = this.currentIndex;

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (startIndex + i) % this.keys.length;
      const keyState = this.keys[idx];

      if (this.isKeyAvailable(keyState)) {
        this.currentIndex = (idx + 1) % this.keys.length;
        keyState.requestsToday++;
        keyState.lastUsed = Date.now();
        this.saveState();
        return { key: keyState.key, index: idx };
      }
    }

    return null; // All keys exhausted
  }

  reportError(index: number): void {
    if (this.keys[index]) {
      this.keys[index].errorsToday++;
      this.saveState();
    }
  }

  reportSuccess(index: number): void {
    if (this.keys[index]) {
      // Reset error count on success
      this.keys[index].errorsToday = Math.max(
        0,
        this.keys[index].errorsToday - 1
      );
      this.saveState();
    }
  }

  getStatus(): Array<{ index: number; available: boolean; requestsToday: number }> {
    return this.keys.map((k, i) => ({
      index: i,
      available: this.isKeyAvailable({ ...k }),
      requestsToday: k.requestsToday,
    }));
  }

  getTotalRequestsToday(): number {
    return this.keys.reduce((sum, k) => sum + k.requestsToday, 0);
  }
}

// ─── Singleton export ─────────────────────────

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_KEY_1,
  import.meta.env.VITE_GEMINI_KEY_2,
  import.meta.env.VITE_GEMINI_KEY_3,
  import.meta.env.VITE_GEMINI_KEY_4,
  import.meta.env.VITE_GEMINI_KEY_5,
  import.meta.env.VITE_GEMINI_KEY_6,
  import.meta.env.VITE_GEMINI_KEY_7,
  import.meta.env.VITE_GEMINI_KEY_8,
].filter(Boolean) as string[];

export const keyRotationManager = new GeminiKeyRotationManager(GEMINI_KEYS);
export type { GeminiKeyRotationManager };
