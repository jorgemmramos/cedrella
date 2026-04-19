// StorageService.cloud.js — Cedrella v1.5
// Drop-in replacement for StorageService.js via import map in index.html.
// Offline-first: writes go to IndexedDB immediately, then to Supabase.
// Failed cloud writes are queued in IndexedDB and retried on reconnect.

import { supabase } from './CedrellaAuth.js';

// ── IndexedDB (Dexie global from CDN) ────────────────────────────────────────

class CedrellaDb extends Dexie {
  constructor() {
    super('cedrella');
    // v1 — matches StorageService.js exactly (no data loss on upgrade)
    this.version(1).stores({
      readings:   'id, sensor_id, timestamp, temp, lux, moisture, conductivity, battery',
      plants:     'id, sensor_id, name, location, created_at',
      sensors:    'id, ble_id, name, firmware, battery, last_seen',
    });
    // v2 — adds offline write queue
    this.version(2).stores({
      sync_queue: '++_seq, created_at',
    });
  }
}

const db = new CedrellaDb();

// ── Helpers ───────────────────────────────────────────────────────────────────

const uuid       = () => crypto.randomUUID();
const isoNow     = () => new Date().toISOString();
const daysAgoIso = days => new Date(Date.now() - days * 86_400_000).toISOString();
const online     = () => navigator.onLine && supabase !== null;

// ── StorageService ────────────────────────────────────────────────────────────

export class StorageService {

  // ── Readings ────────────────────────────────────────────────────────────────

  async save(reading) {
    const record = {
      id:        reading.id        ?? uuid(),
      timestamp: reading.timestamp ?? isoNow(),
      ...reading,
    };
    await db.readings.add(record);
    await this._push('readings', 'insert', record);
    return record;
  }

  async getHistory(sensorId, days = 7) {
    const since = daysAgoIso(days);

    if (online()) {
      try {
        const { data, error } = await supabase
          .from('readings')
          .select('*')
          .eq('sensor_id', sensorId)
          .gte('timestamp', since)
          .order('timestamp', { ascending: true });
        if (!error && data?.length) {
          await db.readings.bulkPut(data).catch(() => {});
          return data;
        }
      } catch { /* fall through to IndexedDB */ }
    }

    const rows = await db.readings
      .where('sensor_id').equals(sensorId)
      .and(r => r.timestamp >= since)
      .toArray();
    return rows.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
  }

  async getLatest(sensorId) {
    if (online()) {
      try {
        const { data } = await supabase
          .from('readings')
          .select('*')
          .eq('sensor_id', sensorId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        if (data) return data;
      } catch { /* fall through */ }
    }

    const rows = await db.readings.where('sensor_id').equals(sensorId).toArray();
    if (!rows.length) return null;
    return rows.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  }

  // ── Plants ───────────────────────────────────────────────────────────────────

  async getPlants() {
    if (online()) {
      try {
        const { data } = await supabase.from('plants').select('*').order('created_at');
        if (data) { await db.plants.bulkPut(data).catch(() => {}); return data; }
      } catch { /* fall through */ }
    }
    return db.plants.toArray();
  }

  async savePlant(plant) {
    const record = {
      id:         plant.id         ?? uuid(),
      created_at: plant.created_at ?? isoNow(),
      ...plant,
    };
    await db.plants.put(record);
    await this._push('plants', 'upsert', record);
    return record;
  }

  async deletePlant(id) {
    await db.plants.delete(id);
    await this._push('plants', 'delete', { id });
  }

  // ── Sensors ──────────────────────────────────────────────────────────────────

  async getSensors() {
    if (online()) {
      try {
        const { data } = await supabase.from('sensors').select('*');
        if (data) { await db.sensors.bulkPut(data).catch(() => {}); return data; }
      } catch { /* fall through */ }
    }
    return db.sensors.toArray();
  }

  async saveSensor(sensor) {
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
    await this._push('sensors', 'upsert', record);
    return record;
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  async exportCsv(sensorId, days = 7) {
    const rows   = await this.getHistory(sensorId, days);
    const header = 'id,sensor_id,timestamp,temp,lux,moisture,conductivity,battery';
    const lines  = rows.map(r =>
      [r.id, r.sensor_id, r.timestamp, r.temp, r.lux, r.moisture, r.conductivity, r.battery].join(',')
    );
    return new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  }

  // ── Cloud push + offline queue ────────────────────────────────────────────────

  async _push(table, operation, record) {
    if (!supabase) return;

    if (!navigator.onLine) {
      await db.sync_queue.add({ table, operation, record, created_at: isoNow() });
      return;
    }

    try {
      await _supabaseWrite(table, operation, record);
    } catch {
      await db.sync_queue.add({ table, operation, record, created_at: isoNow() });
      // Ask the Service Worker to retry when connectivity returns
      navigator.serviceWorker?.ready
        .then(sw => sw.sync?.register('cedrella-sync'))
        .catch(() => {});
    }
  }

  // Called by Dashboard when SW sends RETRY_WRITES message
  async retryPending() {
    if (!supabase || !navigator.onLine) return;
    const items = await db.sync_queue.orderBy('_seq').toArray();
    for (const item of items) {
      try {
        await _supabaseWrite(item.table, item.operation, item.record);
        await db.sync_queue.delete(item._seq);
      } catch {
        break; // Still failing — stop until next retry
      }
    }
  }

  // ── Initial sync after login ──────────────────────────────────────────────────

  static async pullFromCloud() {
    if (!supabase) return;
    const [readingsRes, plantsRes, sensorsRes] = await Promise.all([
      supabase.from('readings').select('*').order('timestamp'),
      supabase.from('plants').select('*').order('created_at'),
      supabase.from('sensors').select('*').order('last_seen'),
    ]);
    if (readingsRes.data?.length) await db.readings.bulkPut(readingsRes.data);
    if (plantsRes.data?.length)   await db.plants.bulkPut(plantsRes.data);
    if (sensorsRes.data?.length)  await db.sensors.bulkPut(sensorsRes.data);
  }
}

// ── Shared Supabase write helper ──────────────────────────────────────────────

async function _supabaseWrite(table, operation, record) {
  let error;
  if (operation === 'insert') {
    ({ error } = await supabase.from(table).insert(record));
  } else if (operation === 'upsert') {
    ({ error } = await supabase.from(table).upsert(record, { onConflict: 'id' }));
  } else if (operation === 'delete') {
    ({ error } = await supabase.from(table).delete().eq('id', record.id));
  }
  if (error) throw error;
}
