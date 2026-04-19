/**
 * BleService — manual browser console test
 *
 * Requirements:
 *   - Chrome 56+ or Edge 79+ (Web Bluetooth API)
 *   - Bluetooth enabled on the PC
 *   - Xiaomi Flower Care sensor powered on and within ~2 m range
 *   - Dev server running: npx serve web/public  (or python -m http.server 8080)
 *   - Open http://localhost:3000 (must be localhost — Web Bluetooth requires secure context)
 *
 * ─── STEP 1 — Import the service ────────────────────────────────────────────
 *
 *   const { BleService } = await import('/src/services/BleService.js');
 *   const ble = new BleService();
 *
 * ─── STEP 2 — Scan for the sensor ───────────────────────────────────────────
 *
 *   const device = await ble.scan();
 *   // A browser dialog opens. Select "Flower care" and click "Pair".
 *   // If you close the dialog without selecting: device === null  (expected)
 *   console.log('Device found:', device?.name);
 *
 * ─── STEP 3 — Connect ────────────────────────────────────────────────────────
 *
 *   const info = await ble.connect(device);
 *   // Expected output:
 *   //   { connected: true, name: 'Flower care', battery: 87, firmware: '3.2.1' }
 *   console.log('Device info:', info);
 *
 * ─── STEP 4 — Read once ──────────────────────────────────────────────────────
 *
 *   const reading = await ble.readOnce();
 *   // Expected: all 5 fields present, values in plausible ranges:
 *   //   temperature:  15–40  (°C)
 *   //   lux:          0–100 000  (lx)
 *   //   moisture:     0–100  (%)
 *   //   conductivity: 0–2000 (µS/cm)
 *   //   timestamp:    ISO 8601 string
 *   console.log('Reading:', reading);
 *
 *   // Validate:
 *   console.assert(typeof reading.temperature  === 'number', 'temperature must be number');
 *   console.assert(typeof reading.lux          === 'number', 'lux must be number');
 *   console.assert(typeof reading.moisture     === 'number', 'moisture must be number');
 *   console.assert(typeof reading.conductivity === 'number', 'conductivity must be number');
 *   console.assert(typeof reading.timestamp    === 'string', 'timestamp must be ISO string');
 *
 * ─── STEP 5 — Auto read (optional) ──────────────────────────────────────────
 *
 *   await ble.startAutoRead(r => console.log('Auto reading:', r), 10000);
 *   // Reads immediately, then every 10 s. Let it run a few cycles.
 *   // Stop with:
 *   ble.stopAutoRead();
 *
 * ─── STEP 6 — Disconnect callback (optional) ─────────────────────────────────
 *
 *   ble.onDisconnected(dev => console.warn('Sensor disconnected:', dev.name));
 *   // Power off the sensor to trigger this.
 *
 * ─── STEP 7 — Disconnect cleanly ─────────────────────────────────────────────
 *
 *   await ble.disconnect();
 *   console.log('Disconnected OK');
 *
 * ─── Common errors ────────────────────────────────────────────────────────────
 *
 *   "Web Bluetooth não está disponível"
 *     → Wrong browser. Use Chrome or Edge.
 *
 *   "NotFoundError" / device === null
 *     → Picker closed without selection, or sensor out of range. Normal.
 *
 *   "Sensor não está ligado"
 *     → Called readOnce() before connect(). Call connect(device) first.
 *
 *   GATT operation failed / connection dropped
 *     → Sensor moved out of range, or another app holds the connection.
 *       Power-cycle the sensor and retry from Step 2.
 */
