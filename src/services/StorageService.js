/**
 * StorageService — cloud migration guide
 * To migrate to cloud (Supabase / Firebase):
 * 1. Replace CedrellaDb with API client initialisation
 * 2. Replace db.readings.add()   with  await api.post('/readings', data)
 * 3. Replace db.readings.where() with  await api.get('/readings?sensor_id=...')
 * Schema is identical — no UI or BleService changes required.
 */

// ─── Database definition ──────────────────────────────────────────────────────

class CedrellaDb extends Dexie {
  constructor() {
    super('cedrella');
    this.version(1).stores({
      readings: 'id, sensor_id, timestamp, temp, lux, moisture, conductivity, battery',
      plants:   'id, sensor_id, name, location, created_at',
      sensors:  'id, ble_id, name, firmware, battery, last_seen',
    });
  }
}

const db = new CedrellaDb();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uuid = () => crypto.randomUUID();

const isoNow = () => new Date().toISOString();

/** ISO string for (now − days) */
const daysAgoIso = (days) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

// ─── StorageService ───────────────────────────────────────────────────────────

export class StorageService {

  // ── Readings ────────────────────────────────────────────────────────────────

  /**
   * Persist a sensor reading. Adds uuid + timestamp if absent.
   * @param {object} reading - { sensor_id, temp, lux, moisture, conductivity, battery, … }
   * @returns {Promise<object>} The saved reading (with id + timestamp)
   */
  async save(reading) {
    const record = {
      id:        reading.id        ?? uuid(),
      timestamp: reading.timestamp ?? isoNow(),
      ...reading,
    };
    await db.readings.add(record);
    return record;
  }

  /**
   * Return all readings for a sensor within the last `days` days, sorted ASC.
   * @param {string} sensorId
   * @param {number} [days=7]
   * @returns {Promise<object[]>}
   */
  async getHistory(sensorId, days = 7) {
    const since = daysAgoIso(days);
    const rows = await db.readings
      .where('sensor_id').equals(sensorId)
      .and(r => r.timestamp >= since)
      .toArray();
    return rows.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
  }

  /**
   * Return the most recent reading for a sensor, or null if none.
   * @param {string} sensorId
   * @returns {Promise<object|null>}
   */
  async getLatest(sensorId) {
    const rows = await db.readings
      .where('sensor_id').equals(sensorId)
      .toArray();
    if (!rows.length) return null;
    return rows.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  }

  // ── Plants ───────────────────────────────────────────────────────────────────

  /**
   * Return all plants.
   * @returns {Promise<object[]>}
   */
  async getPlants() {
    return db.plants.toArray();
  }

  /**
   * Insert or update a plant. Adds uuid + created_at if absent.
   * @param {object} plant - { name, location, sensor_id, limits, … }
   * @returns {Promise<object>} The saved plant
   */
  async savePlant(plant) {
    const record = {
      id:         plant.id         ?? uuid(),
      created_at: plant.created_at ?? isoNow(),
      ...plant,
    };
    await db.plants.put(record);
    return record;
  }

  /**
   * Remove a plant by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deletePlant(id) {
    await db.plants.delete(id);
  }

  // ── Sensors ──────────────────────────────────────────────────────────────────

  /**
   * Return all sensors.
   * @returns {Promise<object[]>}
   */
  async getSensors() {
    return db.sensors.toArray();
  }

  /**
   * Insert or update a sensor. Always stamps last_seen = now.
   * Adds uuid if absent. Merges with existing record so partial updates are safe.
   * @param {object} sensor - { ble_id, name, firmware?, battery?, … }
   * @returns {Promise<object>} The saved sensor
   */
  async saveSensor(sensor) {
    // Look up existing record by ble_id so callers don't need to track the uuid
    const existing = sensor.ble_id
      ? await db.sensors.where('ble_id').equals(sensor.ble_id).first()
      : null;

    const record = {
      ...(existing ?? {}),
      id:        existing?.id ?? sensor.id ?? uuid(),
      last_seen: isoNow(),
      ...sensor,
    };
    await db.sensors.put(record);
    return record;
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  /**
   * Export history as a CSV Blob ready for download.
   * @param {string} sensorId
   * @param {number} [days=7]
   * @returns {Promise<Blob>}
   */
  async exportCsv(sensorId, days = 7) {
    const rows = await this.getHistory(sensorId, days);
    const header = 'id,sensor_id,timestamp,temp,lux,moisture,conductivity,battery';
    const lines = rows.map(r =>
      [r.id, r.sensor_id, r.timestamp, r.temp, r.lux, r.moisture, r.conductivity, r.battery]
        .join(',')
    );
    return new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  }
}
