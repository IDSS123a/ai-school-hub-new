import { useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './authStore';
import type { UserProfile } from '../../types';

export function useAuth() {
  const store = useAuthStore();

  // ─── Initialize Auth Listener ─────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        store.setSession({
          access_token: session.access_token,
          expires_at: session.expires_at ?? 0,
        });
        await fetchAndSetProfile(session.user.id);
      }
      store.setLoading(false);
      store.setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          store.setSession({
            access_token: session.access_token,
            expires_at: session.expires_at ?? 0,
          });
          await fetchAndSetProfile(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          store.clearAuth();
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          store.setSession({
            access_token: session.access_token,
            expires_at: session.expires_at ?? 0,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ─── Fetch User Profile ───────────────────────────────
  async function fetchAndSetProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      store.setError('Greška pri učitavanju profila.');
      return;
    }

    store.setUser(data as UserProfile);

    // Update last seen (fire and forget)
    supabase.rpc('update_last_seen', { p_user_id: userId }).then(() => {});
  }

  // ─── Sign In ──────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
      store.setLoading(true);
      store.setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const msg = getAuthErrorMessage(error.message);
        store.setError(msg);
        store.setLoading(false);
        return { success: false, error: msg };
      }

      store.setLoading(false);
      return { success: true };
    },
    []
  );

  // ─── Sign Out ─────────────────────────────────────────
  const signOut = useCallback(async () => {
    store.setLoading(true);
    await supabase.auth.signOut();
    store.clearAuth();
    store.setLoading(false);
  }, []);

  // ─── Request Password Reset ───────────────────────────
  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  // ─── Update Profile ───────────────────────────────────
  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile,
      'full_name' | 'avatar_url' | 'preferences'>>) => {
      const userId = store.user?.id;
      if (!userId) return { success: false, error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) return { success: false, error: error.message };

      await fetchAndSetProfile(userId);
      return { success: true };
    },
    [store.user?.id]
  );

  // ─── Log Activity ─────────────────────────────────────
  const logActivity = useCallback(async (
    action: string,
    entityType = 'system',
    entityId?: string
  ) => {
    const userId = store.user?.id;
    if (!userId) return;

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
    });
  }, [store.user?.id]);

  // ─── Error messages ───────────────────────────────────
  function getAuthErrorMessage(message: string): string {
    const map: Record<string, string> = {
      'Invalid login credentials': 'Pogrešan email ili lozinka.',
      'Email not confirmed':       'Email nije potvrđen. Provjerite inbox.',
      'Too many requests':         'Previše pokušaja. Sačekajte nekoliko minuta.',
      'User not found':            'Korisnički račun nije pronađen.',
    };
    return map[message] ?? 'Greška pri prijavi. Pokušajte ponovo.';
  }

  return {
    user:            store.user,
    isLoading:       store.isLoading,
    isInitialized:   store.isInitialized,
    error:           store.error,
    isAuthenticated: !!store.user,
    isAdmin:         store.isAdmin(),
    isTeacher:       store.isTeacher(),
    isStaff:         store.isStaff(),
    hasAccess:       store.hasAccess,
    signIn,
    signOut,
    requestPasswordReset,
    updateProfile,
    logActivity,
  };
}
