import { PT }           from '../i18n/pt.js';
import { CedrellaAuth } from '../services/CedrellaAuth.js';

const LEAF_SVG = `<svg class="app-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 4-8 8"/>
</svg>`;

export class AuthScreen {
  mount(selector) {
    this._selector = selector;
    this._root     = document.querySelector(selector);
    this._root.innerHTML = this._html();
    this._bind();
  }

  _html() {
    const localMode = !CedrellaAuth.isConfigured();
    return `
<div class="auth-screen">
  <div class="auth-card">
    <div class="auth-brand">
      ${LEAF_SVG}
      <span class="app-name">${PT.appName}</span>
    </div>
    <p class="auth-subtitle">${PT.authSubtitle}</p>

    ${localMode ? `
      <div class="auth-local">
        <p class="auth-local__text">${PT.localModeWarning}</p>
        <button class="btn btn--primary btn--full" id="auth-local-btn">${PT.continueOffline}</button>
      </div>
    ` : `
      <form class="auth-form" id="auth-form" novalidate>
        <label class="auth-label" for="auth-email">${PT.emailLabel}</label>
        <input class="auth-input" type="email" id="auth-email"
               placeholder="nome@exemplo.pt" autocomplete="email" required />
        <button class="btn btn--primary btn--full" type="submit" id="auth-btn">
          ${PT.sendMagicLink}
        </button>
      </form>

      <div class="auth-sent" id="auth-sent" hidden>
        <div class="auth-sent__icon" aria-hidden="true">✉️</div>
        <p class="auth-sent__text">
          ${PT.checkEmail}<br>
          <strong id="auth-email-display"></strong>
        </p>
        <button class="btn btn--ghost btn--full" id="auth-resend">${PT.resend}</button>
      </div>

      <p class="auth-error" id="auth-error" hidden role="alert"></p>
    `}
  </div>
</div>`;
  }

  _bind() {
    document.getElementById('auth-form')?.addEventListener('submit', e => {
      e.preventDefault();
      this._submit(document.getElementById('auth-email').value.trim());
    });

    document.getElementById('auth-resend')?.addEventListener('click', () => {
      const email = document.getElementById('auth-email-display').textContent;
      this._submit(email);
    });

    // Local-only mode: skip auth and go straight to Dashboard
    document.getElementById('auth-local-btn')?.addEventListener('click', async () => {
      const { Dashboard } = await import('./Dashboard.js');
      new Dashboard().mount(this._selector);
    });
  }

  async _submit(email) {
    const btn   = document.getElementById('auth-btn');
    const error = document.getElementById('auth-error');

    if (error) error.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = PT.signingIn; }

    try {
      await CedrellaAuth.sendMagicLink(email);
      document.getElementById('auth-form').hidden  = true;
      document.getElementById('auth-sent').hidden  = false;
      document.getElementById('auth-email-display').textContent = email;
    } catch (err) {
      if (error) { error.textContent = err.message; error.hidden = false; }
      if (btn) { btn.disabled = false; btn.textContent = PT.sendMagicLink; }
    }
  }
}
