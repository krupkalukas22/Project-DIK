# Přehled komunikace IK

Dashboard pro analýzu komunikačních dat z Excel souborů.

## Požadavky

- Node.js 16+ a npm

## Instalace

1. Rozbalte všechny soubory do složky projektu
2. Nainstalujte závislosti:

\`\`\`bash
npm install
\`\`\`

## Spuštění

### Vývojový režim

\`\`\`bash
npm run dev
\`\`\`

Aplikace běží na `http://localhost:5173`

### Build pro produkci

\`\`\`bash
npm run build
\`\`\`

Výsledné soubory jsou ve složce `dist/`

### Náhled produkční verze

\`\`\`bash
npm run preview
\`\`\`

## Funkce

- ✅ Nahrávání Excel souborů (.xlsx, .xls)
- ✅ Filtrování podle časového období
- ✅ Statistiky a průměry
- ✅ Interaktivní grafy (spojnicové, sloupcové, koláčové)
- ✅ Kumulativní analýza
- ✅ Tmavý/světlý režim
- ✅ Porovnání s předchozím obdobím
- ✅ Export tabulkových dat

## Struktura Excel souboru

Aplikace očekává následující strukturu:

- Sloupec B: Datum
- Sloupec C: Hovory
- Sloupec D: E-maily
- Sloupec E: E-podání
- Sloupec F: DPM

První 2 řádky jsou přeskočeny (hlavička).

## Technologie

- React 18
- Vite
- Tailwind CSS
- Recharts (grafy)
- SheetJS (xlsx)
- Lucide React (ikony)

## Podpora

Pro problémy nebo dotazy vytvořte issue na GitHubu.
\`\`\`

---

## 🚀 Rychlý start

1. **Vytvořte novou složku** pro projekt
2. **Vytvořte všechny soubory** podle struktury výše
3. **Spusťte v terminálu:**

\`\`\`bash
npm install
npm run dev
\`\`\`

4. **Otevřete** `http://localhost:5173` v prohlížeči

---

## 📝 Poznámky

- Projekt používá **Vite** jako build nástroj (rychlejší než Create React App)
- **Tailwind CSS** zajišťuje styling
- **SheetJS** zpracovává Excel soubory
- Všechny závislosti jsou v `package.json`
- Projekt je plně funkční i offline po buildu

---

## 🔧 Možnosti úprav

V `src/App.jsx` můžete upravit:
- Barvy grafů (konstanty pro barvy)
- Strukturu sloupců (colMap objekty)
- Přednastavená časová období
- Texty a popisky

---

**Vše potřebné je zde! Stačí vytvořit soubory a spustit `npm install` + `npm run dev`.**