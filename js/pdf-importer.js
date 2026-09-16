/**
 * PDF-Klassenlisten-Importer für Klassen-Trainer
 * Liest OCR-lesbare PDF-Klassenlisten 100% lokal & offline im Browser ein.
 * Unterstützt einzeilige und mehrzeilige Tabellenlayouts (z. B. aus Schild-NRW, Untis etc.)
 * Nutzt Mozilla pdf.js (libs/pdf.min.js & libs/pdf.worker.min.js).
 */

import { processImportRows } from './excel-importer.js';

const DATE_REGEX = /\b(\d{1,2}[./-]\d{1,2}[./-](\d{2,4}))\b|\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/;

/**
 * Verarbeitet eine ausgewählte PDF-Datei (vollständig clientseitig im Browser)
 * @param {File|Blob} file - Die PDF-Datei
 * @param {Array} existingStudents - Bereits vorhandene Schüler in der Klasse
 * @param {string} classId - ID der aktuellen Klasse
 * @returns {Promise<{updatedStudents: Array, newStudents: Array, matchedDetails: Array, totalRows: number}>}
 */
export async function processPdfImport(file, existingStudents = [], classId = '') {
  if (typeof window.pdfjsLib === 'undefined') {
    await loadPdfJsScript();
  }

  if (!window.pdfjsLib) {
    throw new Error('PDF-Engine konnte nicht initialisiert werden.');
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = './libs/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const allRows = [
    ['Nachname', 'Vorname', 'Geb.dat/Gebort', 'Anschrift', 'Telefon', 'E-Mail']
  ];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageRows = parsePageStudents(textContent);
    allRows.push(...pageRows);
  }

  if (allRows.length < 2) {
    throw new Error('In der PDF-Datei konnten keine Schülerzeilen mit Namen und Geburtsdaten gefunden werden. Bitte prüfe, ob die Datei OCR-lesbaren Text enthält.');
  }

  // Durch die bewährte Import- & Fuzzy-Matching-Logik verarbeiten
  // Wichtig: Bei bestehender Klasse werden nicht-anwesende Schüler automatisch ignoriert!
  return processImportRows(allRows, existingStudents, classId);
}

/**
 * Analysiert eine PDF-Seite und extrahiert die Schüler-Datensätze
 */
function parsePageStudents(textContent) {
  const items = textContent.items
    .map((it) => ({
      str: String(it.str || '').trim(),
      x: Math.round(it.transform[4]),
      y: Math.round(it.transform[5]),
      w: Math.round(it.width || 0)
    }))
    .filter((it) => it.str && it.str !== '|');

  if (items.length === 0) return [];

  // 1. Suche nach der Tabellenkopfzeile
  // Zeilen nach Y gruppieren mit 4pt Toleranz
  const lineMap = new Map();
  for (const it of items) {
    let matchedY = null;
    for (const ky of lineMap.keys()) {
      if (Math.abs(ky - it.y) <= 4) {
        matchedY = ky;
        break;
      }
    }
    if (matchedY === null) {
      matchedY = it.y;
      lineMap.set(it.y, []);
    }
    lineMap.get(matchedY).push(it);
  }

  const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

  let headerY = null;
  let headerItems = [];

  for (const y of sortedYs) {
    const line = lineMap.get(y).sort((a, b) => a.x - b.x);
    const lineText = line.map((it) => it.str).join(' ').toLowerCase();

    if (
      (lineText.includes('nachname') || lineText.includes('name')) &&
      (lineText.includes('geb') || lineText.includes('vorname') || lineText.includes('anschrift') || lineText.includes('telefon'))
    ) {
      headerY = y;
      headerItems = line;
      break;
    }
  }

  // Spaltenkoordinaten ermitteln
  let colNr = 36;
  let colName = 58;
  let colGeb = 159;
  let colAddr = 248;
  let colPhone = 469;

  if (headerItems.length >= 3) {
    const nrItem = headerItems.find((it) => /nr/i.test(it.str));
    const nameItem = headerItems.find((it) => /name/i.test(it.str));
    const gebItem = headerItems.find((it) => /geb/i.test(it.str));
    const addrItem = headerItems.find((it) => /anschrift|adresse/i.test(it.str));
    const phoneItem = headerItems.find((it) => /telefon|tel|mobil|handy/i.test(it.str));

    if (nrItem) colNr = nrItem.x;
    if (nameItem) colName = nameItem.x;
    if (gebItem) colGeb = gebItem.x;
    if (addrItem) colAddr = addrItem.x;
    if (phoneItem) colPhone = phoneItem.x;
  }

  const bounds = [
    (colNr + colName) / 2,     // 0: Trennung Nr -> Name (~47)
    (colName + colGeb) / 2,    // 1: Trennung Name -> Geb (~108)
    (colGeb + colAddr) / 2,    // 2: Trennung Geb -> Anschrift (~203)
    (colAddr + colPhone) / 2   // 3: Trennung Anschrift -> Telefon (~358)
  ];

  // Nur Inhalts-Items unterhalb der Kopfzeile und oberhalb der Fußzeile (Seitenzahlen, Druckdatum)
  const contentItems = items.filter((it) => {
    if (headerY !== null && it.y >= headerY - 5) return false;
    if (it.y < 55) return false; // Footer
    if (/schuljahr|klassenlehrer|adressenliste|druckdatum/i.test(it.str)) return false;
    return true;
  });

  // A. Mehrzeilige Datensätze mit Schülernummern ("1.", "2.", ...) am linken Rand
  const numItems = contentItems.filter((it) => /^\d+\.?$/.test(it.str) && it.x < bounds[0] + 8);
  numItems.sort((a, b) => b.y - a.y);

  if (numItems.length >= 2) {
    return extractNumberedBlocks(contentItems, numItems, bounds);
  }

  // B. Mehrzeilige Datensätze ohne Nummern: Verankerung an den Geburtsdaten
  const dateItems = contentItems.filter((it) => DATE_REGEX.test(it.str) && it.x >= bounds[1] - 15 && it.x < bounds[2] + 15);
  dateItems.sort((a, b) => b.y - a.y);

  if (dateItems.length >= 2) {
    return extractDateAnchoredBlocks(contentItems, dateItems, bounds);
  }

  // C. Fallback: Einzeilige Tabelle
  return extractSingleLineRows(sortedYs, lineMap, headerY);
}

/**
 * Extrahiert Schülerdaten aus mehrzeiligen Blöcken, die durch Schülernummern getrennt sind
 */
function extractNumberedBlocks(contentItems, numItems, bounds) {
  const resultRows = [];

  for (let i = 0; i < numItems.length; i++) {
    const curNum = numItems[i];
    const nextNum = numItems[i + 1];

    const topY = curNum.y + 10;
    const bottomY = nextNum ? (nextNum.y + 10) : 55;

    const blockItems = contentItems.filter((it) => it.y <= topY && it.y > bottomY);
    const row = parseStudentBlock(blockItems, bounds);
    if (row) resultRows.push(row);
  }

  return resultRows;
}

/**
 * Extrahiert Schülerdaten aus mehrzeiligen Blöcken, die durch Geburtsdaten getrennt sind
 */
function extractDateAnchoredBlocks(contentItems, dateItems, bounds) {
  const resultRows = [];

  for (let i = 0; i < dateItems.length; i++) {
    const curDate = dateItems[i];
    const nextDate = dateItems[i + 1];

    const topY = curDate.y + 10;
    const bottomY = nextDate ? (nextDate.y + 10) : 55;

    const blockItems = contentItems.filter((it) => it.y <= topY && it.y > bottomY);
    const row = parseStudentBlock(blockItems, bounds);
    if (row) resultRows.push(row);
  }

  return resultRows;
}

/**
 * Extrahiert Felder (Nachname, Vorname, Geb.dat/Gebort, Anschrift, Telefon) aus einem Schüler-Block
 */
function parseStudentBlock(blockItems, bounds) {
  // Namen: Volljährigkeitsstatus (vj / volljährig) niemals in den Namenspool aufnehmen!
  const nameItems = blockItems.filter((it) => {
    if (it.x < bounds[0] || it.x >= bounds[1]) return false;
    const strClean = String(it.str || '').trim();
    if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(strClean)) return false;
    return true;
  });
  const gebItems = blockItems.filter((it) => it.x >= bounds[1] && it.x < bounds[2]);
  const addrItems = blockItems.filter((it) => it.x >= bounds[2] && it.x < bounds[3]);
  const phoneItems = blockItems.filter((it) => it.x >= bounds[3]);

  nameItems.sort((a, b) => b.y - a.y);
  gebItems.sort((a, b) => b.y - a.y);
  addrItems.sort((a, b) => b.y - a.y);
  phoneItems.sort((a, b) => b.y - a.y);

  // Namen: In Schild-NRW liegt oben der Nachname, darunter der Vorname
  let lastName = '';
  let firstName = '';
  if (nameItems.length > 0) {
    const highestY = nameItems[0].y;
    const topName = nameItems.filter((it) => Math.abs(it.y - highestY) <= 4).map((it) => it.str).join(' ').trim();
    const bottomName = nameItems.filter((it) => it.y < highestY - 4).map((it) => it.str).join(' ').trim();

    if (bottomName) {
      lastName = topName;
      firstName = bottomName;
    } else {
      if (topName.includes(',')) {
        const p = topName.split(',');
        lastName = p[0].trim();
        firstName = p.slice(1).join(' ').trim();
      } else {
        const p = topName.split(/\s+/);
        lastName = p[0];
        firstName = p.slice(1).join(' ');
      }
    }
  }

  // Zusätzliche Härtung: VJ niemals als Vor- oder Nachname akzeptieren
  if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(firstName.trim())) {
    firstName = '';
  }
  if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(lastName.trim())) {
    lastName = '';
  }

  if (!lastName && !firstName) return null;

  // Geburtsdatum & Geburtsort
  let birthDate = '';
  let birthPlace = '';
  const allGebText = gebItems.map((it) => it.str).join(' ').trim();
  const dMatch = allGebText.match(DATE_REGEX);
  if (dMatch) {
    birthDate = dMatch[0];
    birthPlace = allGebText.replace(dMatch[0], '').replace(/^[\s/,\-:;|]+|[\s/,\-:;|]+$/g, '').trim();
  } else {
    birthPlace = allGebText;
  }

  // Anschrift formatieren (Straße vor Ort/PLZ)
  let address = '';
  if (addrItems.length > 0) {
    const highestY = addrItems[0].y;
    const part1 = addrItems.filter((it) => Math.abs(it.y - highestY) <= 4).map((it) => it.str).join(' ').trim();
    const part2 = addrItems.filter((it) => it.y < highestY - 4).map((it) => it.str).join(' ').trim();
    if (part1 && part2) {
      if (/^\d{5}\b/.test(part1)) {
        address = `${part2}, ${part1}`;
      } else {
        address = `${part1}, ${part2}`;
      }
    } else {
      address = part1 || part2;
    }
  }

  const phone = phoneItems.map((it) => it.str).join(' ').trim();

  // E-Mail-Adresse extrahieren falls vorhanden
  let email = '';
  for (const it of blockItems) {
    const emMatch = it.str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emMatch) {
      email = emMatch[0].trim();
      break;
    }
  }

  return [lastName, firstName, `${birthDate} ${birthPlace}`.trim(), address, phone, email];
}

/**
 * Fallback für klassische einzeilige PDF-Tabellen
 */
function extractSingleLineRows(sortedYs, lineMap, headerY) {
  const rows = [];
  for (const y of sortedYs) {
    if (headerY !== null && y >= headerY - 4) continue;
    if (y < 55) continue;

    const line = lineMap.get(y).sort((a, b) => a.x - b.x);
    const fullLineStr = line.map((it) => it.str).join(' ').trim();
    if (/schuljahr|klassenlehrer|adressenliste|druckdatum/i.test(fullLineStr)) continue;

    const dMatch = fullLineStr.match(DATE_REGEX);
    if (!dMatch && line.length < 2) continue;

    if (/\s{2,}|\t/.test(fullLineStr)) {
      const parts = fullLineStr.split(/\s{2,}|\t/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        if (/^\d+[\.:]?$/.test(parts[0])) parts.shift();
        rows.push(parts);
        continue;
      }
    }

    if (dMatch) {
      const parts = fullLineStr.split(dMatch[0]);
      let namePart = (parts[0] || '').trim().replace(/^\d+[\.\)\s]+/, '').trim();
      let afterPart = (parts[1] || '').trim();

      let lastName = namePart;
      let firstName = '';
      if (namePart.includes(',')) {
        const splitComma = namePart.split(',');
        lastName = splitComma[0].trim();
        firstName = splitComma[1].trim();
      } else {
        const tokens = namePart.split(/\s+/);
        if (tokens.length >= 2) {
          lastName = tokens[0];
          firstName = tokens.slice(1).join(' ');
        }
      }

      let phone = '';
      const phoneMatch = afterPart.match(/(?:\+49|0049|0)\s*[1-9][\d\s\-/()]{5,}\d/);
      if (phoneMatch) {
        phone = phoneMatch[0].trim();
        afterPart = afterPart.replace(phoneMatch[0], ' ').trim();
      }

      let cleanBirthPlace = birthPlace.replace(/\b(vj\.?|vollj\.?|volljährig|volljaehrig)\b/gi, '').trim();
      let cleanFirst = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(firstName.trim())) ? '' : firstName;
      let cleanLast = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(lastName.trim())) ? '' : lastName;

      if (cleanLast) {
        rows.push([cleanLast, cleanFirst, `${dMatch[0]} ${cleanBirthPlace}`.trim(), '', phone, email]);
      }
    }
  }
  return rows;
}

/**
 * Lädt die lokale PDF.js-Bibliothek, falls noch nicht eingebunden
 */
async function loadPdfJsScript() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve();

    const script = document.createElement('script');
    script.src = './libs/pdf.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Konnte libs/pdf.min.js nicht laden'));
    document.head.appendChild(script);
  });
}
