/**
 * Excel- & CSV-Import & Export mit fehlertolerantem Namensabgleich (Fuzzy Matching)
 * Verwendet SheetJS (libs/xlsx.full.min.js) vollständig lokal und offline.
 */

import { getStudentsByClass } from './db.js';
import { formatDateDisplay } from './parser.js';
import { ensurePhoneticInMnemonic } from './phonetics.js';

/**
 * Normalisiert Zeichenketten für den fehlertoleranten Vergleich:
 * Entfernt Umlaute-Unterschiede, Akzente, Satzzeichen und Leerzeichen.
 */
/**
 * Normalisiert ein einzelnes Token/Wort für den fehlertoleranten Vergleich:
 * Entfernt Umlaute-Unterschiede, Akzente, Satzzeichen und Sonderzeichen.
 */
export function normalizeToken(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Normalisiert Zeichenketten für den fehlertoleranten Vergleich (Legacy & Token-Helfer)
 */
export function normalizeName(str) {
  return normalizeToken(str);
}

/**
 * Berechnet die Levenshtein-Distanz zwischen zwei Strings
 */
export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[n] = prev;
  }
  return row[n];
}

/**
 * Berechnet Ähnlichkeit zwischen zwei Einzelwörtern / Tokens (inkl. Präfix-Match für Kurzformen wie 'Wil' vs 'Wilhelm')
 */
export function tokenSimilarity(strA, strB) {
  const normA = normalizeToken(strA);
  const normB = normalizeToken(strB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Präfix-Übereinstimmung (z.B. "Wil" -> "Wilhelm", "Alex" -> "Alexander")
  if (normA.startsWith(normB) || normB.startsWith(normA)) {
    const shorter = Math.min(normA.length, normB.length);
    if (shorter >= 3) return 0.92;
  }

  // Teilwort-Übereinstimmung (z.B. bei zusammengesetzten Namen)
  if (normA.includes(normB) || normB.includes(normA)) {
    const shorter = Math.min(normA.length, normB.length);
    if (shorter >= 3) return 0.88;
  }

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshtein(normA, normB);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Berechnet einen Ähnlichkeitswert von 0.0 bis 1.0 (Legacy-Kompatibilität)
 */
export function stringSimilarity(strA, strB) {
  return tokenSimilarity(strA, strB);
}

/**
 * Bereinigt Rohtexte von Klammerzusätzen wie (inaktiv), Zahlen oder Bindestrichen
 */
function cleanNameRaw(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/\(inaktiv\)|\(abwesend\)|\(ausgeschieden\)|\(archiviert\)|\d+/gi, ' ')
    .replace(/[_\-,;/]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim();
}

/**
 * Berechnet die Gesamtnamens-Ähnlichkeit zwischen einem Tabelleneintrag und einem Schüler.
 * Arbeitet Token-basiert, um Mehrfachvornamen, vertauschte Namensreihenfolge (Vorname/Nachname)
 * und unvollständige Namensbestandteile extrem fehlertolerant abzugleichen.
 */
export function matchStudentScore(rowNameData, student) {
  const isVJ = (s) => /^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(String(s || '').trim());

  const rowLastRaw = isVJ(rowNameData.lastName) ? '' : cleanNameRaw(rowNameData.lastName || '');
  const rowFirstRaw = isVJ(rowNameData.firstName) ? '' : cleanNameRaw(rowNameData.firstName || '');
  const rowFullRaw = cleanNameRaw(rowNameData.fullName || '');

  const studLastRaw = isVJ(student.lastName) ? '' : cleanNameRaw(student.lastName || '');
  const studFirstRaw = isVJ(student.firstName) ? '' : cleanNameRaw(student.firstName || '');

  // Alle Wörter / Tokens extrahieren (ab 2 Zeichen, VJ ausschließen)
  const rowTokens = `${rowLastRaw} ${rowFirstRaw} ${rowFullRaw}`
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !isVJ(t));

  const studTokens = `${studLastRaw} ${studFirstRaw}`
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !isVJ(t));

  if (rowTokens.length === 0 || studTokens.length === 0) return 0.0;

  // 1. Nachnamen-Übereinstimmung (hohe Priorität)
  const rowLastTokens = (rowLastRaw || rowTokens[0] || '').split(/\s+/).filter(t => t.length > 1);
  let lastNameSim = 0.0;
  for (const rlt of rowLastTokens) {
    for (const st of studTokens) {
      const sim = tokenSimilarity(rlt, st);
      if (sim > lastNameSim) lastNameSim = sim;
    }
  }

  // 2. Vornamen-Übereinstimmung
  const rowFirstTokens = (rowFirstRaw || rowTokens.slice(1).join(' ') || '').split(/\s+/).filter(t => t.length > 1);
  let firstNameSim = 0.0;
  for (const rft of rowFirstTokens) {
    for (const st of studTokens) {
      const sim = tokenSimilarity(rft, st);
      if (sim > firstNameSim) firstNameSim = sim;
    }
  }

  // 3. Token-Abdeckung gesamt (wie viele Wörter aus der Zeile finden sich im Schüler wieder)
  let matchedTokens = 0;
  for (const rt of rowTokens) {
    let best = 0;
    for (const st of studTokens) {
      const sim = tokenSimilarity(rt, st);
      if (sim > best) best = sim;
    }
    if (best >= 0.80) matchedTokens++;
  }
  const coverage = matchedTokens / Math.max(rowTokens.length, studTokens.length);

  // Falls Vorname beim Schüler fehlt oder Alt-Daten "VJ" waren:
  // Nicht mit VornameSim = 0 abstrafen, sondern Nachname & Abdeckung gewichten
  if (!studFirstRaw || !rowFirstRaw) {
    return 0.75 * lastNameSim + 0.25 * coverage;
  }

  // Gesamtnote: 50% Nachname, 30% Vorname, 20% Gesamt-Abdeckung
  return 0.50 * lastNameSim + 0.30 * firstNameSim + 0.20 * coverage;
}

/**
 * Konvertiert unterschiedliche Datumsformate (Excel-Seriennummer, DD.MM.YYYY, YYYY-MM-DD)
 * in das Standard-Format YYYY-MM-DD (für HTML-Date-Inputs)
 */
export function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return null;

  const currentYear = new Date().getFullYear();

  // 1. Excel-Seriennummer (Zahl ab 1900, z. B. 41234)
  if (typeof val === 'number') {
    if (window.XLSX && window.XLSX.SSF && window.XLSX.SSF.parse_date_code) {
      try {
        const dObj = window.XLSX.SSF.parse_date_code(val);
        if (dObj && dObj.y && dObj.m && dObj.d) {
          let yyyy = dObj.y;
          // Falls fälschlicherweise Volljährigkeitsdatum (18 Jahre in der Zukunft):
          if (yyyy > currentYear) {
            yyyy -= 18;
          }
          const yStr = String(yyyy).padStart(4, '0');
          const mm = String(dObj.m).padStart(2, '0');
          const dd = String(dObj.d).padStart(2, '0');
          return `${yStr}-${mm}-${dd}`;
        }
      } catch (_) {}
    }
    // Näherungs-Fallback für Excel-Datum
    const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      let yyyy = jsDate.getFullYear();
      if (yyyy > currentYear) {
        yyyy -= 18;
      }
      const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
      const dd = String(jsDate.getDate()).padStart(2, '0');
      return `${String(yyyy).padStart(4, '0')}-${mm}-${dd}`;
    }
  }

  // 2. Falls bereits Date-Objekt
  if (val instanceof Date && !isNaN(val.getTime())) {
    let yyyy = val.getFullYear();
    if (yyyy > currentYear) {
      yyyy -= 18;
    }
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${String(yyyy).padStart(4, '0')}-${mm}-${dd}`;
  }

  const str = String(val).trim();

  // 3. Deutsches Format DD.MM.YYYY, D.M.YYYY, DD.MM.YY oder D.M.YY
  const deMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (deMatch) {
    const dd = deMatch[1].padStart(2, '0');
    const mm = deMatch[2].padStart(2, '0');
    let yyyy = deMatch[3];
    if (yyyy.length === 2) {
      let yNum = parseInt(yyyy, 10);
      let fullYear = (yNum < 50) ? (2000 + yNum) : (1900 + yNum);
      // Wenn Datum in der Zukunft liegt (> aktuelles Jahr, z. B. 2027),
      // ist es das Volljährigkeitsdatum (18. Geburtstag) -> 18 Jahre abziehen
      if (fullYear > currentYear) {
        fullYear -= 18;
      }
      yyyy = String(fullYear);
    } else if (parseInt(yyyy, 10) > currentYear) {
      // 4-stellige Zukunftszahl (z. B. 2027)
      yyyy = String(parseInt(yyyy, 10) - 18);
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  // 4. ISO Format YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (isoMatch) {
    let yyyy = parseInt(isoMatch[1], 10);
    if (yyyy > currentYear) {
      yyyy -= 18;
    }
    const mm = isoMatch[2].padStart(2, '0');
    const dd = isoMatch[3].padStart(2, '0');
    return `${String(yyyy).padStart(4, '0')}-${mm}-${dd}`;
  }

  // 5. JavaScript Date Fallback
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    let yyyy = d.getFullYear();
    if (yyyy > currentYear) yyyy -= 18;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${String(yyyy).padStart(4, '0')}-${mm}-${dd}`;
  }

  return str; // Unverändert belassen falls Freitext
}

/**
 * Erkennt relevante Spalten in einer Zeilen-Kopfzeile
 */
function detectColumns(headers) {
  const mapping = {
    lastNameIdx: -1,
    firstNameIdx: -1,
    fullNameIdx: -1,
    birthdateIdx: -1,
    countryIdx: -1,
    addressIdx: -1,
    phoneIdx: -1,
    emailIdx: -1
  };

  headers.forEach((h, idx) => {
    const clean = String(h || '').trim().toLowerCase();

    // Spalten für Volljährigkeit / VJ ignorieren, damit sie nicht als Geburtsdatum oder Geburtsort gewertet werden
    if (/^(vj|vollj|vollj\.|volljährig|volljaehrig|volljährig\s*am|18\.?\s*geburtstag|vj-status|status)$/i.test(clean)) {
      return;
    }

    // Nachname
    if (mapping.lastNameIdx === -1 && /^(nachname|familienname|surname|last\s*name)$/i.test(clean)) {
      mapping.lastNameIdx = idx;
    } else if (mapping.lastNameIdx === -1 && /(nachname|familienname)/i.test(clean)) {
      mapping.lastNameIdx = idx;
    }

    // Vorname
    if (mapping.firstNameIdx === -1 && /^(vorname|rufname|given\s*name|first\s*name)$/i.test(clean)) {
      mapping.firstNameIdx = idx;
    } else if (mapping.firstNameIdx === -1 && /(vorname|rufname)/i.test(clean)) {
      mapping.firstNameIdx = idx;
    }

    // Kombinierter Name
    if (mapping.fullNameIdx === -1 && /^(name|schueler|schüler|schuelername|schülername|vollständiger\s*name)$/i.test(clean)) {
      mapping.fullNameIdx = idx;
    }

    // Kombinierte Geburtsdaten- & Geburtsort-Spalte (z. B. "Geb.dat/Gebort", "Geburtsdatum / Geburtsort")
    if (/(geb\.?\s*dat.*geb\.?\s*ort|geburt.*ort|geb.*ort.*dat)/i.test(clean)) {
      if (mapping.birthdateIdx === -1) mapping.birthdateIdx = idx;
      if (mapping.countryIdx === -1) mapping.countryIdx = idx;
    }

    // Geburtsdatum
    if (mapping.birthdateIdx === -1 && /(geburtsdatum|geburtstag|geb\.|geb_dat|gebdatum|birth|dob|geboren)/i.test(clean)) {
      mapping.birthdateIdx = idx;
    }

    // Herkunftsland / Herkunft / Geburtsort / Nationalität (kein VJ!)
    if (mapping.countryIdx === -1 && /(herkunftsland|herkunft|geburtsort|gebort|geb_ort|geb\.\s*ort|geburts_ort|staatsangeh|nationalit|country|citizenship|staat)/i.test(clean)) {
      mapping.countryIdx = idx;
    }

    // Anschrift / Adresse / Wohnort
    if (mapping.addressIdx === -1 && /(anschrift|adresse|wohnanschrift|strasse|straße|str\.|wohnort|plz|street|address)/i.test(clean)) {
      mapping.addressIdx = idx;
    }

    // Telefon / Mobil / Notfallnummer
    if (mapping.phoneIdx === -1 && /(telefon|telefonnummer|tel\b|tel\.|handy|mobil|mobilfunk|notfallnummer|notfallkontakt|phone|mobile)/i.test(clean)) {
      mapping.phoneIdx = idx;
    }

    // E-Mail / Mail
    if (mapping.emailIdx === -1 && /(e-?mail|mail|elektronische\s*post)/i.test(clean)) {
      mapping.emailIdx = idx;
    }
  });

  // Falls Nachname noch nicht zugeordnet, aber fullNameIdx vorhanden und kein separater Vorname
  if (mapping.lastNameIdx === -1 && mapping.fullNameIdx !== -1 && mapping.firstNameIdx === -1) {
    // Bleibt als fullNameIdx
  } else if (mapping.lastNameIdx === -1 && mapping.fullNameIdx !== -1) {
    mapping.lastNameIdx = mapping.fullNameIdx;
  }

  return mapping;
}

/**
 * Liest eine Excel- oder CSV-Datei ein und führt den fehlertoleranten Import durch
 * @param {ArrayBuffer} arrayBuffer - Rohdaten der Datei
 * @param {Array<Object>} existingStudents - Bestehende Schüler der aktuellen Klasse
 * @param {string} classId - ID der aktuellen Klasse
 * @returns {Object} Ergebnis des Imports
 */
export async function processExcelImport(arrayBuffer, existingStudents, classId) {
  if (!window.XLSX) {
    throw new Error('SheetJS-Bibliothek nicht geladen.');
  }

  const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Die Excel-Tabelle enthält keine Tabellenblätter.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Als zweidimensionales Array einlesen
  const rawRows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('Die Tabelle enthält keine Datenzeilen.');
  }

  return processImportRows(rawRows, existingStudents, classId);
}

/**
 * Universelle Verarbeitungsfunktion für tabellarische Daten (Excel, CSV und PDF)
 */
export function processImportRows(rawRows, existingStudents, classId) {
  // 1. Kopfzeile suchen (erste Zeile mit mindestens 2 belegten Spalten)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    const filled = row.filter(c => String(c || '').trim().length > 0);
    if (filled.length >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = rawRows[headerRowIdx];
  const colMap = detectColumns(headers);

  const matchedStudents = [];
  const updatedStudents = [];
  const newStudents = [];
  const unmatchedRows = [];

  // Kopie der existierenden Schüler für Zuordnungs-Tracking
  const remainingExisting = existingStudents.map(s => ({ ...s }));

  // 2. Datenzeilen vorab parsen
  const parsedRows = [];
  const datePattern = /\b(\d{1,2}[./-]\d{1,2}[./-](\d{2,4}))\b|\b(\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/;

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.every(c => String(c || '').trim().length === 0)) continue;

    let lastName = colMap.lastNameIdx !== -1 ? String(row[colMap.lastNameIdx] || '').trim() : '';
    let firstName = colMap.firstNameIdx !== -1 ? String(row[colMap.firstNameIdx] || '').trim() : '';
    let fullName = colMap.fullNameIdx !== -1 ? String(row[colMap.fullNameIdx] || '').trim() : '';

    if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(firstName.trim())) firstName = '';
    if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(lastName.trim())) lastName = '';

    // Falls Name als "Nachname, Vorname" kombiniert ist
    if (!lastName && fullName) {
      if (fullName.includes(',')) {
        const parts = fullName.split(',');
        lastName = parts[0].trim();
        firstName = parts.slice(1).join(' ').trim();
      } else if (fullName.includes(' ')) {
        const parts = fullName.split(/\s+/);
        lastName = parts[parts.length - 1].trim();
        firstName = parts.slice(0, -1).join(' ').trim();
      } else {
        lastName = fullName;
      }
    }

    if (!lastName && !firstName) continue; // Zeile ohne Namen überspringen

    let birthDate = null;
    let country = '';

    // Geburtsdatum & Geburtsort extrahieren (unterstützt auch kombinierte Felder wie "02.07.2007 Kairo / Ägypten")
    const rawBirthdate = colMap.birthdateIdx !== -1 ? row[colMap.birthdateIdx] : null;
    const rawCountry = colMap.countryIdx !== -1 ? row[colMap.countryIdx] : null;

    if (rawBirthdate !== null && rawBirthdate !== undefined && rawBirthdate !== '') {
      if (typeof rawBirthdate === 'number') {
        birthDate = parseExcelDate(rawBirthdate);
      } else {
        const birthStr = String(rawBirthdate).trim();
        const match = birthStr.match(datePattern);
        if (match) {
          birthDate = parseExcelDate(match[0]);
          const remainder = birthStr.replace(match[0], '').replace(/^[\s/,\-:;|]+|[\s/,\-:;|]+$/g, '').trim();
          if (remainder) {
            country = remainder;
          }
        } else {
          birthDate = parseExcelDate(birthStr);
        }
      }
    }

    if (rawCountry !== null && rawCountry !== undefined && rawCountry !== '') {
      const countryStr = String(rawCountry).trim();
      const match = countryStr.match(datePattern);
      if (match && !birthDate) {
        birthDate = parseExcelDate(match[0]);
        const remainder = countryStr.replace(match[0], '').replace(/^[\s/,\-:;|]+|[\s/,\-:;|]+$/g, '').trim();
        if (remainder) country = remainder;
      } else if (!country || colMap.countryIdx !== colMap.birthdateIdx) {
        const cleaned = countryStr.replace(datePattern, '').replace(/^[\s/,\-:;|]+|[\s/,\-:;|]+$/g, '').trim();
        if (cleaned) country = cleaned;
      }
    }

    // "vj" oder "volljährig" ist ein Schulstatus, KEIN Geburtsort!
    if (/^(vj\.?|vollj\.?|volljährig|volljaehrig|ja|nein)$/i.test(country.trim())) {
      country = '';
    }

    // Anschrift & Telefonnummer extrahieren
    let address = colMap.addressIdx !== -1 ? String(row[colMap.addressIdx] || '').trim() : '';
    let phone = colMap.phoneIdx !== -1 ? String(row[colMap.phoneIdx] || '').trim() : '';
    if (typeof row[colMap.phoneIdx] === 'number') {
      phone = String(row[colMap.phoneIdx]);
    }

    // Falls die Telefonnummer mit in der Anschrift steht
    if (!phone && address) {
      const phoneMatch = address.match(/(?:\+49|0049|0)\s*[1-9][\d\s\-/()]{5,}\d/);
      if (phoneMatch) {
        phone = phoneMatch[0].trim();
        address = address.replace(phoneMatch[0], '').replace(/[,;\s]+$/, '').trim();
      }
    }

    // E-Mail-Adresse extrahieren (aus Spalte oder freiem Zellinhalt)
    let email = colMap.emailIdx !== -1 ? String(row[colMap.emailIdx] || '').trim() : '';
    if (!email) {
      for (const cell of row) {
        const cellStr = String(cell || '').trim();
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cellStr)) {
          email = cellStr;
          break;
        }
      }
    }

    parsedRows.push({
      rIdx: parsedRows.length,
      lastName,
      firstName,
      fullName,
      birthDate,
      country,
      address,
      phone,
      email
    });
  }

  // 3. Wenn die Klasse bisher ganz leer war: Alle Zeilen direkt neu anlegen
  if (remainingExisting.length === 0) {
    for (const row of parsedRows) {
      const cleanLast = row.lastName || 'Unbekannt';
      const cleanFirst = row.firstName || '';
      const cleanCountry = row.country || '';
      const newStudent = {
        id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        classId: classId,
        firstName: cleanFirst,
        lastName: cleanLast,
        birthDate: row.birthDate || null,
        country: cleanCountry,
        address: row.address || '',
        phone: row.phone || '',
        email: row.email || '',
        mnemonic: ensurePhoneticInMnemonic('', cleanLast, cleanFirst, cleanCountry),
        imageBlob: null,
        audioBlob: null,
        needsReview: false,
        leitnerBox: 1,
        createdAt: Date.now()
      };
      newStudents.push(newStudent);
    }

    return {
      updatedStudents: [],
      newStudents,
      matchedDetails: [],
      unmatchedRows: [],
      totalRows: parsedRows.length
    };
  }

  // 4. Globale Affinitäts-Zuordnung (Best-Score-First)
  // Alle möglichen Paare (Zeile, Schüler) mit Score >= 0.65 sammeln und nach Score sortieren
  const matchCandidates = [];
  for (const rowData of parsedRows) {
    for (const student of remainingExisting) {
      const score = matchStudentScore(rowData, student);
      if (score >= 0.65) {
        matchCandidates.push({
          rIdx: rowData.rIdx,
          student,
          score,
          rowData
        });
      }
    }
  }

  // Höchste Scores zuerst binden, um "Match-Diebstahl" auszuschließen
  matchCandidates.sort((a, b) => b.score - a.score);

  const matchedRowIndices = new Set();
  const matchedStudentIds = new Set();

  for (const cand of matchCandidates) {
    if (matchedRowIndices.has(cand.rIdx) || matchedStudentIds.has(cand.student.id)) {
      continue;
    }

    matchedRowIndices.add(cand.rIdx);
    matchedStudentIds.add(cand.student.id);

    const bestMatch = cand.student;
    const row = cand.rowData;

    // A. Geburtsdatum aktualisieren
    if (row.birthDate) {
      bestMatch.birthDate = row.birthDate;
    } else if (bestMatch.birthDate) {
      // Altdatum bereinigen falls es fehlerhaft "6.1.27" oder Zukunft ist
      bestMatch.birthDate = parseExcelDate(bestMatch.birthDate);
    }

    // B. Geburtsort aktualisieren & Altschrott "vj" entfernen
    if (row.country && !/^(vj\.?|vollj\.?|volljährig)$/i.test(row.country.trim())) {
      bestMatch.country = row.country.trim();
    } else if (/^(vj\.?|vollj\.?|volljährig)$/i.test((bestMatch.country || '').trim())) {
      bestMatch.country = ''; // Altschrott "vj" restlos löschen!
    }

    // C. Kontaktdaten
    if (row.address) bestMatch.address = row.address;
    if (row.phone) bestMatch.phone = row.phone;
    if (row.email) bestMatch.email = row.email;

    // D. Namen korrigieren auf saubere offizielle Schreibweise aus Excel
    if (row.lastName && row.lastName !== 'Unbekannt' && !/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(row.lastName.trim())) {
      bestMatch.lastName = row.lastName.replace(/[\x00-\x1F\x7F]/g, '').trim();
    }
    if (row.firstName && !/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(row.firstName.trim())) {
      bestMatch.firstName = row.firstName.replace(/[\x00-\x1F\x7F]/g, '').trim();
    } else if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test((bestMatch.firstName || '').trim())) {
      bestMatch.firstName = ''; // VJ als Vorname restlos löschen!
    }

    // E. Lautschrift in der ersten Zeile der Eselsbrücke sicherstellen (anhand Name & Herkunftsland)
    bestMatch.mnemonic = ensurePhoneticInMnemonic(
      bestMatch.mnemonic || '',
      bestMatch.lastName,
      bestMatch.firstName,
      bestMatch.country,
      true
    );

    matchedStudents.push({
      student: bestMatch,
      score: Math.round(cand.score * 100),
      rowName: `${row.lastName}, ${row.firstName}`.trim()
    });
    updatedStudents.push(bestMatch);
  }

  // Nicht gematchte Zeilen erfassen
  for (const row of parsedRows) {
    if (!matchedRowIndices.has(row.rIdx)) {
      unmatchedRows.push(row);
    }
  }

  return {
    updatedStudents,
    newStudents,
    unmatchedRows,
    matchedDetails: matchedStudents,
    totalRows: parsedRows.length
  };
}

/**
 * Exportiert eine Klasse als formatierte Excel-Tabelle (.xlsx)
 * @param {string} classId - ID der zu exportierenden Klasse
 * @param {string} className - Name der Klasse
 */
export async function exportClassExcel(classId, className) {
  if (!window.XLSX) {
    throw new Error('SheetJS-Bibliothek nicht geladen.');
  }

  const students = await getStudentsByClass(classId);
  if (!students || students.length === 0) {
    throw new Error('Diese Klasse enthält keine Schüler zum Exportieren.');
  }

  // Alphabetisch nach Nachname, dann Vorname sortieren
  const sortedStudents = [...students].sort((a, b) => {
    const lastA = (a.lastName || '').localeCompare(b.lastName || '', 'de', { sensitivity: 'base' });
    if (lastA !== 0) return lastA;
    return (a.firstName || '').localeCompare(b.firstName || '', 'de', { sensitivity: 'base' });
  });

  const headers = [
    'Nachname',
    'Vorname',
    'Geburtsdatum',
    'Geburtsort',
    'Adresse',
    'Telefonnummer',
    'E-Mail-Adresse'
  ];

  const dataRows = sortedStudents.map((s) => {
    const formattedDate = s.birthDate ? formatDateDisplay(s.birthDate) : '';
    const birthPlace = (s.country || s.birthPlace || '').trim();
    return [
      s.lastName || '',
      s.firstName || '',
      formattedDate,
      birthPlace,
      s.address || '',
      s.phone || '',
      s.email || ''
    ];
  });

  const worksheet = window.XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  // Schöne Spaltenbreiten für Microsoft Excel / LibreOffice
  worksheet['!cols'] = [
    { wch: 20 }, // Nachname
    { wch: 18 }, // Vorname
    { wch: 15 }, // Geburtsdatum
    { wch: 24 }, // Geburtsort
    { wch: 35 }, // Adresse
    { wch: 22 }, // Telefonnummer
    { wch: 30 }  // E-Mail-Adresse
  ];

  const workbook = window.XLSX.utils.book_new();
  const safeSheetName = (className || 'Schülerliste').slice(0, 31).replace(/[\\/:*?[\]]/g, '_');
  window.XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const safeFilename = `${(className || 'Klasse').replace(/[\\/:*?"<>|]/g, '_')}_Schuelerliste.xlsx`;
  window.XLSX.writeFile(workbook, safeFilename);
}
