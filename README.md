# Cedrella

**Empresa:** Paisagem Espantosa  
**Missão:** Monitorização inteligente de plantas com sensor Xiaomi Flower Care via Bluetooth Low Energy.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://jorgemmramos.github.io/cedrella/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-blue)](https://jorgemmramos.github.io/cedrella/)
[![Deploy](https://github.com/jorgemmramos/cedrella/actions/workflows/deploy.yml/badge.svg)](https://github.com/jorgemmramos/cedrella/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-1.0-green)](https://github.com/jorgemmramos/cedrella/releases/tag/v1.0)

---

## Demo

**URL:** https://jorgemmramos.github.io/cedrella/

> Abre no Chrome ou Edge com Bluetooth activo e um sensor Flower Care por perto.

---

## Versões

| Versão | Plataforma | Estado    |
|--------|------------|-----------|
| v1     | Web PWA    | ATIVO     |
| v2     | Windows    | FUTURO    |
| v3     | Android    | FUTURO    |

---

## Quick Start

### 1. Usar a versão em produção (recomendado)

Abrir https://jorgemmramos.github.io/cedrella/ no Chrome ou Edge.

### 2. Correr localmente

```bash
git clone https://github.com/jorgemmramos/cedrella.git
cd cedrella
npx serve web
```

Abre em: http://localhost:3000

> O `serve.json` em `web/` mapeia `/` → `public/index.html` e expõe `src/` como `/src/`.  
> **Nota:** Web Bluetooth só funciona em HTTPS ou `localhost`.

### 3. Alternativa Python

```bash
cd web
python -m http.server 8080
```

Abre em: http://localhost:8080/public/

---

## Compatibilidade de browsers

| Browser | Versão mínima | Web Bluetooth | PWA Install |
|---------|--------------|---------------|-------------|
| Chrome (desktop) | 56+ | ✅ | ✅ |
| Edge (desktop) | 79+ | ✅ | ✅ |
| Chrome (Android) | 56+ | ✅ | ✅ |
| Safari (iOS/macOS) | ❌ | ❌ | ⚠️ limitado |
| Firefox | qualquer | ❌ | ❌ |
| Samsung Internet | 6.0+ | ✅ | ✅ |

> Safari não suporta Web Bluetooth API. Usar Chrome ou Edge.

---

## Sensor suportado

**Xiaomi Flower Care** (Mi Flora / HHCCJCY01)

| Métrica | Unidade |
|---------|---------|
| Temperatura | °C |
| Luminosidade | lux |
| Humidade do solo | % |
| Fertilidade (condutividade) | µS/cm |

Protocolo BLE documentado em:
[WatchFlower — flowercare.svg](https://github.com/emericg/WatchFlower/blob/master/docs/flowercare.svg)

---

## Instalar como PWA

### Windows (Chrome/Edge)
1. Abrir https://jorgemmramos.github.io/cedrella/
2. Clicar no ícone de instalação na barra de endereço
3. Clicar **Instalar**

### Android (Chrome)
1. Abrir https://jorgemmramos.github.io/cedrella/
2. Menu (⋮) → **Adicionar ao ecrã inicial**

---

## Estrutura de pastas

```
cedrella/
  web/
    src/
      services/         # BleService, StorageService, NotifyService
      components/       # Dashboard, MetricCard, AlertBanner, Chart
      theme/            # CedrellaTheme.css (design tokens + component CSS)
      i18n/             # pt.js (strings em português)
    public/
      index.html        # Shell PWA
      manifest.json     # Web App Manifest
      sw.js             # Service Worker (cache offline)
    docs/
      TESTE-SENSOR.md   # Guia de teste com sensor real
  qt/                   # v2/v3 — WatchFlower fork (não tocar em v1)
  CLAUDE.md             # Contexto para Claude Code
```

---

## Guia de teste

Ver [web/docs/TESTE-SENSOR.md](web/docs/TESTE-SENSOR.md) para o guia completo de validação com sensor real.

---

## Roadmap

| Versão | Funcionalidade |
|--------|----------------|
| v1.0 | PWA Web + BLE + IndexedDB local |
| v1.5 | Sync cloud (Supabase/Firebase) + conta de utilizador |
| v2.0 | App Windows nativa (Qt6/QML) |
| v3.0 | App Android nativa (Qt6/QML) |
