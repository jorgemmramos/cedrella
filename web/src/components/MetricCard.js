export class MetricCard {
  /**
   * @param {{ id, label, value, unit, status, icon, progressPct, statusMessage }} props
   */
  constructor(props) {
    this.props = { status: 'ok', progressPct: 0, statusMessage: '', ...props };
    this.el    = null;
  }

  render() {
    this.el = document.createElement('div');
    this._sync();
    return this.el;
  }

  update(props) {
    Object.assign(this.props, props);
    if (this.el) this._sync();
  }

  _sync() {
    const { id, label, value, unit, status, icon, progressPct, statusMessage } = this.props;

    this.el.className      = `metric-card metric-card--${status}`;
    this.el.dataset.metric = id;

    const display = value !== null && value !== undefined ? value : '--';

    this.el.innerHTML = `
      <div class="metric-card__header">
        <span class="metric-card__icon" aria-hidden="true">${icon}</span>
        <span class="metric-card__label">${label}</span>
      </div>
      <div class="metric-card__value">
        <span class="metric-card__number">${display}</span>
        <span class="metric-card__unit">${unit}</span>
      </div>
      <div class="metric-card__bar" role="progressbar"
           aria-valuenow="${Math.round(progressPct)}" aria-valuemin="0" aria-valuemax="100">
        <div class="metric-card__bar-fill" style="width:${Math.min(100, progressPct)}%"></div>
      </div>
      ${statusMessage ? `<p class="metric-card__status">${statusMessage}</p>` : ''}
    `;
  }
}
