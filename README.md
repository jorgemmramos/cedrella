# Cedrella

**Empresa:** Paisagem Espantosa
**Missão:** Monitorização inteligente de plantas com sensor Xiaomi Flower Care via Bluetooth Low Energy.

---

## Versões

| Versão | Plataforma | Estado    |
|--------|------------|-----------|
| v1     | Web PWA    | ATIVO     |
| v2     | Windows    | FUTURO    |
| v3     | Android    | FUTURO    |

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
    serve.json          # Configuração do servidor de desenvolvimento
    docs/
  qt/                   # v2/v3 — WatchFlower fork (não tocar em v1)
  CLAUDE.md             # Contexto para Claude Code
  README.md
```

---

## Como correr localmente

### Opção A — Node.js (`npx serve`)

```bash
npx serve web
```

Abre em: http://localhost:3000

> O `serve.json` em `web/` mapeia `/` → `public/index.html` e expõe `src/` como `/src/`.

### Opção B — Python

```bash
cd web
python -m http.server 8080
```

Abre em: http://localhost:8080/public/

> Com Python o URL de entrada é `/public/index.html`, não `/`. Usar a Opção A para desenvolvimento.

> **Nota:** O Web Bluetooth API só funciona em HTTPS ou `localhost`.
> Para testes BLE reais, usa Chrome ou Edge.

---

## Sensor suportado

**Xiaomi Flower Care** (Mi Flora / HHCCJCY01)

Leituras: Temperatura · Luminosidade · Humidade do solo · Condutividade

Protocolo BLE documentado em:
[WatchFlower — flowercare.svg](https://github.com/emericg/WatchFlower/blob/master/docs/flowercare.svg)

---

## Requisitos

- Chrome 56+ ou Edge 79+ (Web Bluetooth API)
- Bluetooth Low Energy activado no dispositivo
- Node.js instalado (para `npx serve`)
