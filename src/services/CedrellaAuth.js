import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON } from '../../config.js';

// Singleton Supabase client — imported by StorageService.cloud.js to share the same session.
// Null when credentials are not configured (local-only mode).
export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

export class CedrellaAuth {
  static isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON);
  }

  /** Send magic-link email. Throws on error. */
  static async sendMagicLink(email) {
    if (!supabase) throw new Error('Supabase não está configurado.');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) throw error;
  }

  /** Returns the current session or null. */
  static async getSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  /** Subscribe to auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, …). */
  static onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  }
}
