import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON } from '../../config.js';

// Singleton Supabase client — imported by StorageService.cloud.js to share the same session.
// Null when credentials are not configured (local-only mode).
// flowType: 'implicit' — tokens arrive in URL hash, works across browsers/webviews.
// (PKCE default fails when the magic link is opened in Gmail/webview ≠ original browser.)
export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { flowType: 'implicit' },
    })
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

  /** Returns the current session or null. Never throws. */
  static async getSession() {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
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
