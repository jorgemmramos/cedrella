// Xiaomi Flower Care BLE UUIDs
// Source: github.com/emericg/WatchFlower/blob/master/docs/flowercare.svg
const SERVICE_UUID        = '00001204-0000-1000-8000-00805f9b34fb';
const CHAR_WRITE          = '00001a00-0000-1000-8000-00805f9b34fb';
const CHAR_DATA           = '00001a01-0000-1000-8000-00805f9b34fb';
const CHAR_INFO           = '00001a02-0000-1000-8000-00805f9b34fb';
const DEVICE_INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';

// Sent to CHAR_WRITE to enable real-time sensor readings (vs. cached values)
// Source: device_flowercare.cpp — writeChunkOne()
const ENABLE_REALTIME_CMD = new Uint8Array([0xA0, 0x1F]);

const READ_INTERVAL_MS = 30000;

export class BleService {
  constructor() {
    this._device     = null;
    this._server     = null;
    this._charData   = null;
    this._autoReadId = null;
  }

  // ─── Scan ─────────────────────────────────────────────────────────────────

  /**
   * Open the browser BLE device picker filtered to Flower Care sensors.
   * @returns {Promise<BluetoothDevice>}
   */
  async scan() {
    if (!navigator.bluetooth) {
      throw new Error(
        'Web Bluetooth não está disponível neste browser. ' +
        'Usa Chrome ou Edge no Windows/Android.'
      );
    }

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: 'Flower care' },
          { name: 'Flower Care' },
          { namePrefix: 'Flower' },
          { namePrefix: 'HHCC' },
        ],
        optionalServices: [SERVICE_UUID, DEVICE_INFO_SERVICE],
      });
    } catch (err) {
      if (err.name === 'NotFoundError') {
        // User closed the picker without selecting a device — not an error
        return null;
      }
      throw err;
    }

    return device;
  }

  // ─── Connect ──────────────────────────────────────────────────────────────

  /**
   * Connect to a device, enable real-time mode, and read device info.
   * @param {BluetoothDevice} device
   * @returns {Promise<{ connected: boolean, name: string, battery: number, firmware: string }>}
   */
  async connect(device) {
    this._device = device;

    device.addEventListener('gattserverdisconnected', () => {
      this._server   = null;
      this._charData = null;
      if (this._onDisconnectedCb) this._onDisconnectedCb(device);
    });

    this._server = await device.gatt.connect();

    const service = await this._server.getPrimaryService(SERVICE_UUID);

    // Enable real-time readings so CHAR_DATA returns live sensor values
    const charWrite = await service.getCharacteristic(CHAR_WRITE);
    await charWrite.writeValue(ENABLE_REALTIME_CMD);

    this._charData = await service.getCharacteristic(CHAR_DATA);

    const { battery, firmware } = await this._readDeviceInfo(service);

    return {
      connected: true,
      name:      device.name ?? 'Flower Care',
      battery,
      firmware,
    };
  }

  // ─── Parse ────────────────────────────────────────────────────────────────

  /**
   * Parse a raw DataView from CHAR_DATA into a structured reading.
   * Byte layout from WatchFlower device_flowercare.cpp:
   *   [0..1] temperature  ×10 (little-endian int16)
   *   [2]    0x00 (reserved)
   *   [3..6] lux           (little-endian uint32)
   *   [7]    moisture      (uint8, %)
   *   [8..9] conductivity  (little-endian uint16, µS/cm)
   * @param {DataView} dataView
   * @returns {{ temperature: number, lux: number, moisture: number, conductivity: number, timestamp: string }}
   */
  parseReading(dataView) {
    const b = dataView;
    return {
      temperature:  (b.getUint8(0) + b.getUint8(1) * 256) / 10,
      lux:           b.getUint8(3) +
                     b.getUint8(4) * 256 +
                     b.getUint8(5) * 65536 +
                     b.getUint8(6) * 16777216,
      moisture:      b.getUint8(7),
      conductivity:  b.getUint8(8) + b.getUint8(9) * 256,
      timestamp:     new Date().toISOString(),
    };
  }

  // ─── Read once ────────────────────────────────────────────────────────────

  /**
   * Perform a single sensor read and return the parsed reading.
   * @returns {Promise<object>}
   */
  async readOnce() {
    if (!this._charData) throw new Error('Sensor não está ligado. Chama connect() primeiro.');
    const value = await this._charData.readValue();
    return this.parseReading(value);
  }

  // ─── Auto read ────────────────────────────────────────────────────────────

  /**
   * Read immediately, then poll every intervalMs.
   * @param {function(object): void} callback  Called with each reading
   * @param {number} [intervalMs]              Defaults to READ_INTERVAL_MS
   */
  async startAutoRead(callback, intervalMs = READ_INTERVAL_MS) {
    this.stopAutoRead();

    const read = async () => {
      try {
        const reading = await this.readOnce();
        callback(reading);
      } catch (err) {
        console.error('[BleService] startAutoRead error:', err);
      }
    };

    await read();
    this._autoReadId = setInterval(read, intervalMs);
  }

  /**
   * Stop the auto-read polling loop.
   */
  stopAutoRead() {
    if (this._autoReadId !== null) {
      clearInterval(this._autoReadId);
      this._autoReadId = null;
    }
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────

  /**
   * Gracefully disconnect and clean up all state.
   */
  async disconnect() {
    this.stopAutoRead();
    if (this._device?.gatt?.connected) {
      this._device.gatt.disconnect();
    }
    this._device   = null;
    this._server   = null;
    this._charData = null;
  }

  // ─── Event hooks ──────────────────────────────────────────────────────────

  /**
   * Register a callback invoked when the sensor drops the connection.
   * @param {function(BluetoothDevice): void} callback
   */
  onDisconnected(callback) {
    this._onDisconnectedCb = callback;
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Read battery % and firmware string from CHAR_INFO.
   * CHAR_INFO layout (from WatchFlower):
   *   [0]    battery level (0–100)
   *   [1]    0x00 separator
   *   [2..7] firmware version as ASCII string
   * @param {BluetoothRemoteGATTService} service
   * @returns {Promise<{ battery: number, firmware: string }>}
   */
  async _readDeviceInfo(service) {
    try {
      const charInfo = await service.getCharacteristic(CHAR_INFO);
      const value    = await charInfo.readValue();
      const battery  = value.getUint8(0);
      const firmware = new TextDecoder().decode(
        new Uint8Array(value.buffer).slice(2, 8)
      ).replace(/\0/g, '').trim();
      return { battery, firmware };
    } catch {
      return { battery: null, firmware: null };
    }
  }
}
