# Guia de Teste — Cedrella v1.0 com Sensor Flower Care

## Pré-requisitos

- Browser: **Chrome 56+** ou **Edge 79+** (obrigatório para Web Bluetooth)
- Bluetooth activo no computador ou telemóvel
- Sensor **Xiaomi Flower Care** (HHCCJCY01) carregado e a menos de 2 metros
- Ligação à internet para aceder ao GitHub Pages

---

## a) Aceder à aplicação

Abrir o browser e navegar para:

```
https://jorgemmramos.github.io/cedrella/
```

Confirmar que a página carrega sem erros de consola (F12 → Console).

---

## b) Ligar o sensor

1. Clicar no botão **"Ligar Sensor"** no ecrã principal
2. O browser mostra uma janela de selecção Bluetooth
3. Na lista, seleccionar **"Flower care"** (ou "Flower Care")
4. Clicar **Emparelhar**

> Se o sensor não aparecer: certificar que o Bluetooth está activo e o sensor está a menos de 2 metros. Tentar agitar o sensor para activar o anúncio BLE.

---

## c) Verificar leituras

Após ligação bem-sucedida, confirmar que os quatro valores aparecem no dashboard:

| Métrica | Unidade | Intervalo normal |
|---------|---------|-----------------|
| Humidade do solo | % | 20–60 % |
| Temperatura | °C | 15–35 °C |
| Luminosidade | lux | 500–50 000 lux |
| Fertilidade (condutividade) | µS/cm | 350–2 000 µS/cm |

Se algum valor aparecer como `--` ou `null`, verificar a ligação BLE e tentar religar.

---

## d) Segunda leitura automática

1. Aguardar **30 segundos** após a primeira leitura
2. Confirmar que os valores no dashboard se actualizam automaticamente
3. No histórico (ícone de gráfico), confirmar que aparecem pelo menos 2 entradas

---

## e) Persistência entre sessões

1. Fechar o browser completamente
2. Reabrir e navegar novamente para `https://jorgemmramos.github.io/cedrella/`
3. **Sem ligar o sensor**, confirmar que:
   - Os dados históricos estão visíveis
   - O gráfico mostra as leituras anteriores
   - O nome da planta e localização estão guardados

> Os dados são guardados em IndexedDB — persistem mesmo sem internet.

---

## f) Exportar dados

1. Clicar no botão **"Exportar dados"**
2. Confirmar que o browser faz download de um ficheiro `.csv`
3. Abrir o ficheiro num editor de texto ou Excel e verificar:
   - Cabeçalho: `timestamp,sensor_id,temperatura,humidade,lux,fertilidade,bateria`
   - Linhas com as leituras registadas

---

## g) Instalar como PWA

### Windows (Chrome/Edge)
1. Na barra de endereço, clicar no ícone **"Instalar Cedrella"** (ícone de monitor com seta)
2. Clicar **Instalar** na janela de confirmação
3. Confirmar que o ícone da Cedrella aparece no menu Iniciar / desktop
4. Abrir a aplicação instalada e verificar que funciona offline

### Android (Chrome)
1. Abrir `https://jorgemmramos.github.io/cedrella/` no Chrome
2. Tocar nos **três pontos** (menu) → **"Adicionar ao ecrã inicial"**
3. Confirmar que o ícone aparece no homescreen
4. Abrir a app — deve abrir em modo standalone (sem barra do browser)

---

## Checklist Final v1.0

- [ ] Sensor Flower Care liga e lê os 4 valores
- [ ] Segunda leitura automática ao fim de 30 segundos
- [ ] Histórico persiste após fechar e reabrir o browser
- [ ] Exportação CSV funciona
- [ ] App instalável como PWA no Windows
- [ ] App instalável como PWA no Android

---

## Problemas conhecidos

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Sensor não aparece na lista | BLE inactivo ou sensor desligado | Activar Bluetooth; agitar sensor |
| "Bluetooth not supported" | Browser incompatível | Usar Chrome 56+ ou Edge 79+ |
| Dados não persistem | Modo privado/incógnito | Usar janela normal |
| PWA não instala | HTTP em vez de HTTPS | Usar o URL do GitHub Pages (HTTPS) |
