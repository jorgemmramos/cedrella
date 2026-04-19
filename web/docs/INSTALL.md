# Cedrella — Guia de instalação

**Versão 1.0 · Web PWA (Progressive Web App)**

---

## Instalar no computador (Chrome ou Edge)

1. Abre **Chrome** ou **Edge** e vai a [https://jorgemmramos.github.io/cedrella](https://jorgemmramos.github.io/cedrella)
2. Aguarda que a página carregue completamente
3. Clica no botão **"Instalar app"** que aparece na parte inferior do ecrã
   — *ou* clica no ícone de instalação (⊕) na barra de endereço do browser
4. Na janela de confirmação, clica em **"Instalar"**
5. A aplicação abre como janela independente (sem barra de browser)

> A Cedrella aparece no menu Iniciar (Windows) ou no Launchpad (macOS)
> e pode ser fixada na barra de tarefas como qualquer outra aplicação.

---

## Instalar no Android (Chrome)

1. Abre o **Chrome** no Android e vai a [https://jorgemmramos.github.io/cedrella](https://jorgemmramos.github.io/cedrella)
2. Aguarda que a página carregue (pode aparecer um banner "Adicionar ao ecrã principal")
3. Se o banner não aparecer: toca no menu ⋮ → **"Adicionar ao ecrã principal"** → **"Instalar"**
4. A aplicação aparece no ecrã principal com o ícone da folha verde

> Em Android, a aplicação corre em modo de ecrã completo sem barra de endereço,
> tal como uma app nativa.

---

## Utilizar sem ligação à internet (modo offline)

Após a primeira visita, a Cedrella funciona sem internet:

- O ecrã principal e os gráficos ficam disponíveis offline
- Os dados históricos (armazenados localmente no dispositivo) continuam acessíveis
- A ligação Bluetooth **não** necessita de internet — funciona sempre em rede local

> Na primeira abertura é necessária ligação à internet para carregar a aplicação.
> A partir daí, tudo funciona offline.

---

## Notas sobre o Web Bluetooth

O Web Bluetooth API — necessário para comunicar com o sensor Flower Care — tem requisitos específicos:

| Browser | Windows | macOS | Android | iOS |
|---------|---------|-------|---------|-----|
| **Chrome 56+** | ✅ | ✅ | ✅ | ❌ |
| **Edge 79+** | ✅ | ✅ | — | ❌ |
| Firefox | ❌ | ❌ | ❌ | ❌ |
| Safari | ❌ | ❌ | ❌ | ❌ |

**Requisitos adicionais:**
- Bluetooth ativo no computador/telemóvel
- A página tem de ser servida em **HTTPS** ou **localhost** (o GitHub Pages usa HTTPS ✓)
- Sensor Flower Care ligado e dentro do alcance (~10 metros)

> **iOS:** O Web Bluetooth não é suportado no iOS/Safari. Não há alternativa sem uma app nativa.

---

## Resolução de problemas comuns

### "Web Bluetooth não está disponível neste browser"
→ Estás a usar Firefox ou Safari. Muda para Chrome ou Edge.

### O sensor não aparece na lista de dispositivos
1. Verifica se o Bluetooth está ativo no dispositivo
2. Aproxima o sensor (menos de 2 metros)
3. Garante que o sensor não está ligado a outro dispositivo (Flower Care só suporta uma ligação de cada vez)
4. Liga e desliga o sensor (mantém o botão lateral 3 segundos)

### A ligação cai frequentemente
- O Flower Care tem um alcance BLE limitado (~10m sem obstáculos)
- Paredes e interferência Wi-Fi podem reduzir o alcance
- A bateria do sensor abaixo de 10% pode causar instabilidade

### Os dados não são guardados
- A Cedrella usa o armazenamento local do browser (IndexedDB)
- Se limpares os dados do browser, o histórico é apagado
- Usa **Exportar dados** regularmente para guardar um CSV de segurança

### "Instalar app" não aparece
- O browser já instalou a aplicação — verifica no ecrã principal ou menu Iniciar
- Em Chrome/Edge, o botão de instalação só aparece se o browser considerar a app válida (HTTPS + manifest + Service Worker — todos presentes nesta versão)
- Tenta abrir uma aba de navegação anónima e visitar o URL novamente

---

## Desinstalar

**Windows:** Menu Iniciar → clica com o botão direito em "Cedrella" → Desinstalar
**macOS:** Launchpad → mantém premido o ícone → clica em ✕
**Android:** Ecrã principal → mantém premido o ícone → "Desinstalar" ou "Remover"

---

*Cedrella v1.0 · Paisagem Espantosa*
