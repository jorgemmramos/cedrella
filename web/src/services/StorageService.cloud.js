/**
 * StorageService.cloud.js — Cedrella v1.5 (cloud phase)
 *
 * Drop-in replacement for StorageService.js.
 * Implements the same public API; swaps IndexedDB for a REST backend.
 *
 * MIGRATION STEPS (Prompt 7):
 *
 * 1. Choose backend:
 *    Option A — Supabase (PostgreSQL + auth + realtime)
 *    Option B — Firebase Firestore (NoSQL, easier offline sync)
 *    Option C — Custom REST API (full control, extra work)
 *
 * 2. Authentication:
 *    Add login/register flow (email+password or Google OAuth).
 *    Store JWT/session token in localStorage.
 *    All requests include Authorization: Bearer <token>.
 *
 * 3. Data model (matches existing IndexedDB schema):
 *    readings: { id, sensor_id, timestamp, temp, lux, moisture, conductivity, battery }
 *    plants:   { id, name, location, sensor_id, limits, created_at }
 *    sensors:  { id, ble_id, name, firmware, battery, last_seen }
 *
 * 4. Offline-first sync strategy:
 *    - Write to IndexedDB immediately (same as v1.0)
 *    - Queue failed cloud writes in a sync_queue table
 *    - On reconnect / SW background sync, flush the queue
 *    - Conflict resolution: last-write-wins by timestamp
 *
 * 5. Swap in the app:
 *    In index.html, replace:
 *      import StorageService from './src/services/StorageService.js'
 *    with:
 *      import StorageService from './src/services/StorageService.cloud.js'
 *    No other files change (Dashboard, PlantCard, etc. are unaffected).
 *
 * PUBLIC API (must match StorageService.js exactly):
 *
 *   saveReading(reading)        → Promise<void>
 *   getReadings(sensorId, n)    → Promise<Reading[]>
 *   savePlant(plant)            → Promise<void>
 *   getPlants()                 → Promise<Plant[]>
 *   saveSensor(sensor)          → Promise<void>
 *   getSensors()                → Promise<Sensor[]>
 *   exportCSV()                 → Promise<string>  (CSV text)
 */

export default class StorageServiceCloud {
  // TODO (Prompt 7): implement cloud sync
}
