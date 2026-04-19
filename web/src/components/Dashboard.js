import { PT }          from '../i18n/pt.js';
import { BleService }  from '../services/BleService.js';
import { StorageService } from '../services/StorageService.js';
import { MetricCard }  from './MetricCard.js';
import { AlertBanner } from './AlertBanner.js';

const RING_R = 42;
const RING_C = +(2 * Math.PI * RING_R).toFixed(2); // 263.89

const ICONS = {
  moisture: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 10 4 14 4 17a8 8 0 0016 0c0-3-2.5-7-8-15z"/></svg>`,
  temperature: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 14.3V5a1 1 0 00-2 0v9.3A3 3 0 1013 14.3z"/></svg>`,
  lux: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.1-7.1-1.4 1.4M6.5 17.5l-1.4 1.4m0-12.8 1.4 1.4m9.6 9.6 1.4 1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  conductivity: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4.5 13.5H11L9 22l10.5-12H13L13 2z"/></svg>`,
};

const LEAF_SVG = `<svg class="app-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 4-8 8"/>
</svg>`;

export class Dashboard {
  constructor() {
    this._ble            = new BleService();
    this._storage        = new StorageService();
    this._root           = null;
    this._connected      = false;
    this._connecting     = false;
    this._demoInterval   = null;
    this._metricCards    = {};
    this._cardsRendered  = false;
    this._storageSensorId = null;
    this._installPrompt  = null;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  mount(selector) {
    this._root = document.querySelector(selector);
    this._root.innerHTML = this._shellHTML();
    this._bindEvents();
  }

  // ─── Shell template ───────────────────────────────────────────────────────

  _shellHTML() {
    return `
<div class="app">
  <header class="app-header">
    <div class="header-brand">
      ${LEAF_SVG}
      <span class="app-name">${PT.appName}</span>
    </div>
    <span class="status-pill status-pill--off" id="status-pill">${PT.noSensor}</span>
  </header>

  <main class="app-main">
    <section class="hero">
      <div class="health-ring-wrap">
        <svg class="health-ring" viewBox="0 0 100 100" aria-label="Pontuação de saúde">
          <circle class="health-ring__track" cx="50" cy="50" r="${RING_R}"/>
          <circle class="health-ring__fill" id="ring-fill" cx="50" cy="50" r="${RING_R}"
            stroke-dasharray="0 ${RING_C}"
            stroke-dashoffset="${(RING_C * 0.25).toFixed(2)}"/>
        </svg>
        <div class="health-ring__center">
          <span class="health-score" id="health-score">--</span>
          <span class="health-label">saúde</span>
        </div>
      </div>
      <p class="last-reading" id="last-reading">${PT.noSensor}</p>
    </section>

    <section class="metrics-grid" id="metrics-grid"></section>

    <section class="alerts" id="alerts" aria-live="polite"></section>

    <div class="toolbar">
      <button class="btn btn--primary btn--full" id="btn-connect">${PT.connectSensor}</button>
      <button class="btn btn--ghost"             id="btn-demo"   >${PT.demoMode}</button>
      <button class="btn btn--ghost"             id="btn-export" disabled>${PT.exportData}</button>
      <button class="btn btn--install"           id="btn-install" hidden>${PT.installApp}</button>
    </div>
  </main>
</div>`;
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  _bindEvents() {
    this._el('btn-connect').addEventListener('click', () =>
      this._connected ? this._handleDisconnect() : this._handleScan()
    );
    this._el('btn-demo').addEventListener('click', () => this._toggleDemo());
    this._el('btn-export').addEventListener('click', () => this._handleExport());
    this._el('btn-install').addEventListener('click', () => this._handleInstall());

    this._ble.onDisconnected(() => this._setConnected(false));

    // PWA install prompt — browser fires this before showing the install banner
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this._installPrompt = e;
      this._el('btn-install').hidden = false;
    });

    window.addEventListener('appinstalled', () => {
      this._installPrompt = null;
      this._el('btn-install').hidden = true;
    });

    // Handle SW retry-writes message (active after cloud migration)
    navigator.serviceWorker?.addEventListener('message', e => {
      if (e.data?.type === 'RETRY_WRITES') this._storage.retryPending?.();
    });
  }

  async _handleInstall() {
    if (!this._installPrompt) return;
    this._installPrompt.prompt();
    const { outcome } = await this._installPrompt.userChoice;
    if (outcome === 'accepted') {
      this._installPrompt = null;
      this._el('btn-install').hidden = true;
    }
  }

  // ─── BLE flow ─────────────────────────────────────────────────────────────

  async _handleScan() {
    if (this._connecting) return;
    this._setConnecting(true);
    this._stopDemo();

    try {
      const device = await this._ble.scan();
      if (!device) { this._setConnecting(false); return; }

      const info = await this._ble.connect(device);

      const sensor = await this._storage.saveSensor({
        ble_id:   device.id,
        name:     info.name,
        battery:  info.battery,
        firmware: info.firmware,
      });
      this._storageSensorId = sensor.id;

      this._setConnected(true, info);
      await this._ble.startAutoRead(r => this._handleReading(r));
    } catch (err) {
      console.error('[Dashboard] scan/connect error:', err);
      this._setConnecting(false);
    }
  }

  async _handleDisconnect() {
    this._ble.stopAutoRead();
    await this._ble.disconnect();
    this._setConnected(false);
  }

  async _handleReading(reading) {
    this._renderReading(reading);
    if (this._storageSensorId) {
      await this._storage.save({ ...reading, sensor_id: this._storageSensorId });
      this._el('btn-export').disabled = false;
    }
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  _renderReading(reading) {
    const alerts = AlertBanner.evaluate(reading);
    this._updateMetrics(reading, alerts);
    this._updateHealthRing(this._healthScore(alerts));
    this._updateAlerts(alerts);
    this._updateTimestamp(reading.timestamp);
  }

  _updateMetrics(reading, alerts) {
    const byMetric = Object.fromEntries(alerts.map(a => [a.metric, a]));

    const defs = [
      {
        id:          'moisture',
        label:       PT.soilMoisture,
        value:       Math.round(reading.moisture),
        unit:        '%',
        progressPct: reading.moisture,
      },
      {
        id:          'temperature',
        label:       PT.temperature,
        value:       reading.temperature.toFixed(1),
        unit:        '°C',
        progressPct: Math.min(100, (reading.temperature / 50) * 100),
      },
      {
        id:          'lux',
        label:       PT.lightLevel,
        value:       reading.lux >= 1000
                       ? (reading.lux / 1000).toFixed(1) + 'k'
                       : reading.lux,
        unit:        'lx',
        progressPct: Math.min(100, (reading.lux / 30000) * 100),
      },
      {
        id:          'conductivity',
        label:       PT.fertility,
        value:       reading.conductivity,
        unit:        'µS',
        progressPct: Math.min(100, (reading.conductivity / 2000) * 100),
      },
    ].map(d => ({
      ...d,
      icon:          ICONS[d.id],
      status:        byMetric[d.id]?.status        ?? 'ok',
      statusMessage: byMetric[d.id]?.message       ?? PT.optimalConditions,
    }));

    const grid = this._el('metrics-grid');

    if (!this._cardsRendered) {
      defs.forEach(d => {
        const card = new MetricCard(d);
        grid.appendChild(card.render());
        this._metricCards[d.id] = card;
      });
      this._cardsRendered = true;
    } else {
      defs.forEach(d => this._metricCards[d.id]?.update(d));
    }
  }

  _healthScore(alerts) {
    const score = { ok: 100, warn: 50, danger: 10 };
    const total = alerts.reduce((s, a) => s + (score[a.status] ?? 100), 0);
    return Math.round(total / alerts.length);
  }

  _updateHealthRing(score) {
    const fill    = document.getElementById('ring-fill');
    const scoreEl = this._el('health-score');
    const dash    = ((score / 100) * RING_C).toFixed(2);

    fill.setAttribute('stroke-dasharray', `${dash} ${RING_C}`);
    fill.dataset.status = score > 70 ? 'ok' : score > 40 ? 'warn' : 'danger';
    scoreEl.textContent = score;
  }

  _updateAlerts(alerts) {
    this._el('alerts').innerHTML = AlertBanner.render(alerts);
  }

  _updateTimestamp(iso) {
    this._el('last-reading').textContent =
      `${PT.lastReading}: ${new Date(iso).toLocaleTimeString('pt-PT')}`;
  }

  // ─── State helpers ────────────────────────────────────────────────────────

  _setConnecting(on) {
    this._connecting = on;
    const btn = this._el('btn-connect');
    btn.textContent = on ? PT.connecting : PT.connectSensor;
    btn.disabled    = on;
  }

  _setConnected(on, info = null) {
    this._connected  = on;
    this._connecting = false;

    const pill = this._el('status-pill');
    const btn  = this._el('btn-connect');

    if (on) {
      pill.textContent = info?.name ?? 'Flower Care';
      pill.className   = 'status-pill status-pill--on';
      btn.textContent  = PT.disconnect;
      btn.disabled     = false;
    } else {
      pill.textContent          = PT.noSensor;
      pill.className            = 'status-pill status-pill--off';
      btn.textContent           = PT.connectSensor;
      btn.disabled              = false;
      this._storageSensorId     = null;
      this._el('btn-export').disabled = true;
    }
  }

  // ─── Demo mode ────────────────────────────────────────────────────────────

  _toggleDemo() {
    this._demoInterval ? this._stopDemo() : this._startDemo();
  }

  _startDemo() {
    if (this._connected) return;
    const btn = this._el('btn-demo');
    btn.classList.add('btn--active');
    btn.textContent = `${PT.demoMode} ✓`;

    const fake = () => ({
      temperature:  +(18 + Math.random() * 14).toFixed(1),
      lux:          Math.round(200 + Math.random() * 20000),
      moisture:     Math.round(15 + Math.random() * 65),
      conductivity: Math.round(80 + Math.random() * 900),
      timestamp:    new Date().toISOString(),
    });

    this._renderReading(fake());
    this._demoInterval = setInterval(() => this._renderReading(fake()), 5000);
  }

  _stopDemo() {
    clearInterval(this._demoInterval);
    this._demoInterval = null;
    const btn = this._el('btn-demo');
    if (btn) { btn.classList.remove('btn--active'); btn.textContent = PT.demoMode; }
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  async _handleExport() {
    if (!this._storageSensorId) return;
    const blob = await this._storage.exportCsv(this._storageSensorId, 7);
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `cedrella-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ─── Util ─────────────────────────────────────────────────────────────────

  _el(id) { return document.getElementById(id); }
}
