import { PT } from '../i18n/pt.js';

// Thresholds from WatchFlower defaults
const RULES = {
  moisture: [
    { max: 15,       status: 'danger', message: PT.soilTooDry },
    { max: 25,       status: 'warn',   message: PT.needsWater },
    { max: 65,       status: 'ok',     message: PT.optimalConditions },
    { max: 80,       status: 'warn',   message: PT.soilTooWet },
    { max: Infinity, status: 'danger', message: PT.soilTooWet },
  ],
  temperature: [
    { max: 10,       status: 'danger', message: PT.tempTooLow },
    { max: 15,       status: 'warn',   message: PT.tempTooLow },
    { max: 30,       status: 'ok',     message: PT.optimalConditions },
    { max: 35,       status: 'warn',   message: PT.tempTooHigh },
    { max: Infinity, status: 'danger', message: PT.tempTooHigh },
  ],
  lux: [
    { max: 100,      status: 'danger', message: PT.lightTooLow },
    { max: 500,      status: 'warn',   message: PT.lightTooLow },
    { max: 30000,    status: 'ok',     message: PT.optimalConditions },
    { max: Infinity, status: 'warn',   message: PT.lightTooHigh },
  ],
  conductivity: [
    { max: 50,       status: 'danger', message: PT.fertilityLow },
    { max: 100,      status: 'warn',   message: PT.fertilityLow },
    { max: 2000,     status: 'ok',     message: PT.optimalConditions },
    { max: Infinity, status: 'danger', message: PT.fertilityHigh },
  ],
};

const LABELS = {
  moisture:     PT.soilMoisture,
  temperature:  PT.temperature,
  lux:          PT.lightLevel,
  conductivity: PT.fertility,
};

function classify(metric, value) {
  const rule = RULES[metric].find(r => value <= r.max);
  return { metric, status: rule.status, message: rule.message };
}

export class AlertBanner {
  /**
   * Evaluate a reading against all thresholds.
   * Always returns 4 entries (one per metric), including 'ok' ones.
   * @param {{ temperature, lux, moisture, conductivity }} reading
   * @returns {{ metric: string, status: 'ok'|'warn'|'danger', message: string }[]}
   */
  static evaluate(reading) {
    return [
      classify('moisture',     reading.moisture),
      classify('temperature',  reading.temperature),
      classify('lux',          reading.lux),
      classify('conductivity', reading.conductivity),
    ];
  }

  /**
   * Render non-ok alerts as an HTML string.
   * @param {{ metric, status, message }[]} alerts
   * @returns {string}
   */
  static render(alerts) {
    const nonOk = alerts.filter(a => a.status !== 'ok');
    if (!nonOk.length) return '';

    return nonOk.map(({ metric, status, message }) => `
      <div class="alert alert--${status}" role="alert">
        <span class="alert__icon">${status === 'danger' ? '⚠' : '!'}</span>
        <span class="alert__label">${LABELS[metric]}:</span>
        <span class="alert__message">${message}</span>
      </div>
    `).join('');
  }
}
