# CEDRELLA — CLAUDE.md
# Master context for Claude Code — read this before every session

## Project
Name: Cedrella
Company: Paisagem Espantosa
Mission: Smart plant monitoring for any BLE plant sensor —
         optimised for Xiaomi Flower Care, built to support others
Repo: github.com/jorgemmramos/cedrella

## Architecture — 3 versions
v1  → Web PWA  (HTML + Vanilla JS + Dexie.js) — PRIMARY
v2  → Windows  (WatchFlower Qt6/QML/C++ fork)  — FUTURE
v3  → Android  (WatchFlower Qt6/QML/C++ fork)  — FUTURE

## Folder structure
cedrella/
  web/
    src/
      services/
        BleService.js
        StorageService.js
        NotifyService.js
      components/
        Dashboard.js
        PlantCard.js
        Chart.js
      theme/
        CedrellaTheme.css
      i18n/
        pt.js
    public/
      manifest.json
      sw.js
      index.html
    docs/
  qt/
  CLAUDE.md
  README.md

## Sensors supported
# Primary (fully implemented in v1):
Xiaomi Flower Care / Mi Flora (HHCCJCY01) — BLE 4.1
Reference: github.com/emericg/WatchFlower/blob/master/docs/flowercare.svg

# Architecture — sensor-agnostic by design:
# BleService.js uses a SensorDriver interface so new sensors
# can be added without changing Dashboard, StorageService or UI.
# To add a new sensor: create src/services/drivers/SensorDriver_[NAME].js
# with methods: getUUIDs(), parseReading(dataView), getName()

# Known compatible sensors for future drivers (from WatchFlower):
# - Parrot Flower Power / Parrot Pot
# - VegTrug Grow Care
# - b-parasite (open hardware, ESP32-based)
# - Any ESP32 custom sensor with documented BLE protocol

# Flower Care UUIDs (v1 implementation):
SERVICE_UUID  = '00001204-0000-1000-8000-00805f9b34fb'
CHAR_WRITE    = '00001a00-0000-1000-8000-00805f9b34fb'
CHAR_DATA     = '00001a01-0000-1000-8000-00805f9b34fb'
CHAR_INFO     = '00001a02-0000-1000-8000-00805f9b34fb'

# Data parsing (from WatchFlower device_flowercare.cpp):
temperature   = (byte[0] + byte[1]*256) / 10
lux           = byte[3] + byte[4]*256 + byte[5]*65536 + byte[6]*16777216
moisture      = byte[7]
conductivity  = byte[8] + byte[9]*256

## Data schema — cloud-ready from day 1
readings: { id(uuid), sensor_id, timestamp(ISO), temp, lux, moisture, conductivity, battery }
plants:   { id(uuid), name, location, sensor_id, limits{}, created_at }
sensors:  { id(uuid), ble_id, name, firmware, battery, last_seen }

## Design tokens
--color-primary:  #2D6A4F
--color-accent:   #52B788
--color-surface:  #F4F6F4
--color-text:     #0D1B14
--color-warn:     #E9C46A
--color-danger:   #E07A5F

## Rules — mandatory for every session
1. Read this file before writing any code
2. Never modify qt/ folder in v1 phase
3. StorageService is the ONLY file that changes for cloud migration
4. Test BLE connection after every change to BleService.js
5. Commit after every validated block — one feature per commit
6. Code in English. UI text and docs in Portuguese
7. Every UI string must be in a constants file (i18n-ready)
8. Use UUIDs for all IDs — never auto-increment integers

## WatchFlower reference
BLE protocol: github.com/emericg/WatchFlower/blob/master/docs/flowercare.svg
C++ parsing:  github.com/emericg/WatchFlower/blob/master/src/devices/device_flowercare.cpp
