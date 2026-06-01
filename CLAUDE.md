# HTML Builder — Projektdokumentation

## Projektbeschreibung
Ein visueller, browser-basierter HTML-Code-Generator. Ziel: Nutzer können HTML-Elemente (Divs, Absätze, Bilder, Überschriften, Trennlinien, Leerzeilen) per Klick zusammenstellen und erhalten fertigen, kopierbaren HTML-Code — ideal für CMS-Beiträge und Forum-Posts.

## Dateien
| Datei | Zweck |
|---|---|
| `index.html` | Komplette Single-Page-App (HTML + CSS + JS, kein Framework, kein Server) |
| `CLAUDE.md` | Diese Dokumentation |

## Öffnen
Einfach `index.html` im Browser öffnen — kein Server, kein npm, keine Installation nötig.

## Architektur (alle in `index.html`)

### Oberfläche
- **Drei-Spalten-Layout** (CSS Grid, 100vh):
  - Links (270px): Element-Palette + Eigenschaften-Panel
  - Mitte (flex): Canvas — Dokumentstruktur als Blöcke
  - Rechts (330px): Generierter HTML-Code + Kopieren-Button
- **Header**: Titel, Vorschau-Button, Alles-löschen-Button
- **Vorschau-Modal**: Zeigt den generierten HTML in einem `<iframe>`

### Unterstützte Elemente
| Typ | HTML-Tag | Beschreibung |
|---|---|---|
| `div` | `<div>` | Container, kann Kindelemente enthalten, alle CSS-Styles konfigurierbar |
| `p` | `<p>` | Absatz, Textinhalt mit HTML-Inline-Markup erlaubt |
| `img` | `<img>` | Bild, mit optionalem `<p style="text-align:...">` Wrapper |
| `hr` | `<hr />` | Trennlinie |
| `h` | `<h1>`–`<h6>` | Überschrift, Level wählbar |
| `br` | `<p>&nbsp;</p>` | Leerzeile |
| `table` | `<table>` | Tabelle mit Editor-Modal; Spalten, Zeilen, Zellen-Merge, Zell-Styles |
| `badge` | `<div>` | Farbiger Abschnittbalken |
| `ul` | `<ul>` | Aufzählungsliste; `content` zeilengetrennte Einträge → `<li>` |
| `ol` | `<ol>` | Nummerierte Liste; `content` zeilengetrennte Einträge → `<li>` |

### Datenmodell (JavaScript)
```javascript
let elements = [];         // Root-Array mit Element-Baum
let selectedId = null;
let contextId = null;      // Ziel-Div für neue Elemente (null = Root)
let idCounter = 0;
let dragId = null;         // Drag & Drop
let selectedCellPos = null; // { ri, ci } — ausgewählte Zelle im Tabellen-Editor

// Normales Element:
{
  id: 'el-1',
  type: 'div',       // div | p | img | hr | h | br | table | badge
  level: 2,          // nur für h
  styles: {},        // CSS als Objekt { 'border-radius': '15px', ... }
  attrs: {},         // HTML-Attribute { src, alt, width, height, wrapAlign }
  content: '',       // Textinhalt für p, h, badge
  children: []       // nur für div
}

// Tabellen-Element zusätzlich:
{
  type: 'table',
  attrs:       { align, border, cellpadding, cellspacing, summary },
  styles:      { width },
  headerStyle: { 'background-color', ... },
  columns:     ['Spalte 1', ...],       // Spaltentitel (thead)
  rows: [
    [ { content, colspan, rowspan, styles:{} }, ... ],  // Zell-Objekte
    ...
  ],
  caption:   '',    // <caption> Text
  useHeader: true,  // false = kein <thead>
  summary:   ''     // summary-Attribut
}
```

### Wichtige Funktionen
| Funktion | Zweck |
|---|---|
| `addElement(type)` | Neues Element erstellen und in `contextId`-Div (oder Root) einfügen |
| `selectElement(id)` | Element auswählen → Eigenschaften-Panel aktualisieren |
| `deleteElement(id)` | Element aus Baum entfernen |
| `moveElement(id, dir)` | Element ±1 verschieben |
| `enterDiv(id)` | Kontext auf ein Div setzen (neue Elemente gehen dann als Kinder rein) |
| `exitContext()` | Kontext zurück auf Root |
| `updateProp(prop, value)` | Eigenschaft des ausgewählten Elements ändern + `renderAll()` |
| `generateHTML(el, indent)` | Rekursiver HTML-Serialisierer |
| `renderAll()` | Canvas + Code + Eigenschaften neu rendern |
| `copyCode()` | Code in Zwischenablage kopieren |
| `previewCode()` | Vorschau-Modal öffnen |

### HTML-Generierung (img-Besonderheit)
Bilder werden standardmäßig mit `text-align:center`-Wrapper erzeugt:
```html
<p style="text-align:center"><img alt="..." src="..." style="height:168px; width:900px" /></p>
```

## Tastaturkürzel
| Taste | Aktion |
|---|---|
| `Escape` | Modal schließen / Auswahl aufheben / Kontext verlassen |
| `Delete` | Ausgewähltes Element löschen (außerhalb von Eingabefeldern) |

## Import-Funktion (📥 Importieren)
- **Button** im Header öffnet ein Modal mit Textarea
- Nutzer fügt bestehenden HTML-Code ein
- **`parseHTMLToElements(htmlStr)`** → DOMParser + rekursives `domToEl(node)`
- **`parseStyleStr(styleStr)`** → parst `"color: red; background-image: url(...);"` korrekt (Semicolons in `url()` werden nicht fälschlicherweise gesplittet)
- Besonderheit: `<p style="text-align:center"><img /></p>` wird als Bild mit `wrapAlign=center` erkannt
- `<p>&nbsp;</p>` wird als Leerzeile (`br`) erkannt
- Zwei Modi: **Ersetzen** (ersetzt alles) / **Anfügen** (fügt ans Ende)

## Drag & Drop
- Jedes Element hat ein `⠿` Drag-Handle links im Header
- HTML5 `draggable="true"` auf jedem Block
- **Drop-Zones** (dünne Balken) erscheinen zwischen allen Elementen beim Ziehen
- `renderElementList(arr, parentId)` rendert Elemente + umgebende Drop-Zones
- Ziehen in ein Div: Drop-Zones erscheinen auch zwischen Kindelementen
- `dropToZone(srcId, afterId, parentId)` führt den Move aus (Ancestor-Check verhindert ungültige Drops)
- **Klick-Bug behoben**: `event.stopPropagation()` auf jedem Block verhindert, dass Klick auf Kind-Element den Eltern-Div auswählt

## Tabellen-Editor Details

- **Modal** öffnet sich über „✏️ Spalten & Zeilen bearbeiten" im Eigenschaften-Panel
- **Zell-Auswahl**: Klick auf eine Zelle → blaue Umrandung + Eigenschaften-Leiste erscheint oben
- **Zell-Eigenschaften**: Colspan, Rowspan, Ausrichtung, Schriftgröße, Fett, Hintergrundfarbe, Textfarbe, Innenabstand
- **colspan/rowspan > 1**: Lila Badge auf Zelle + überdeckte Zellen werden grau mit „↗ verbunden" markiert
- **⚙ Optionen**: Tabellenüberschrift (`<caption>`) + „Kopfzeile anzeigen"-Toggle
- **`normalizeCell(c)`**: Wandelt alte String-Zellen in Zell-Objekte um (Rückwärtskompatibilität)
- **`buildCoverageMap(rows)`**: Berechnet welche Zellen durch spanning überdeckt werden
- **`tblSetCellProp(prop, val)`**: Strukturelle Props (colspan/rowspan) → `renderTableEditor()`; Style-Props → direkte DOM-Aktualisierung ohne Neubau (kein Input-Verlust)

## Änderungshistorie
| Datum | Änderung |
|---|---|
| 2026-05-27 | Initiales Projekt erstellt — visuelle Block-Builder Single-Page-App |
| 2026-05-27 | Bild-Element: `wrapAlign`-Option hinzugefügt |
| 2026-05-27 | Import-Funktion: HTML-Code parsen → Blöcke; `buildStyleStr` fix für `url("...")` → `url(&quot;...&quot;)` |
| 2026-05-27 | Drag & Drop zum Verschieben/Umstrukturieren; Klick-Bug (Eltern-Div schluckt Klicks) behoben |
| 2026-05-27 | Neue Elemente: Tabelle (`<table>` mit Editor-Modal) + Abzeichen (Farbbalken) |
| 2026-05-27 | Vorschau-Fix: öffnet jetzt echten Browser-Tab via Blob-URL statt iframe (behebt `background-attachment:fixed` + weiße Bereiche) |
| 2026-05-27 | Tabellen-Editor: Zell-Zusammenführung (colspan/rowspan), per-Zelle Styles (BG, Farbe, Schrift, Padding), Caption, useHeader-Toggle, Summary; Import verbessert |
