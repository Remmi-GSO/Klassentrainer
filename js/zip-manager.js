/**
 * Fehlertoleranter ZIP-Import & Export mit JSZip
 * Liest Bilder, extrahiert Metadaten, normalisiert Umlaute und verarbeitet Audios.
 */

import { parseFilename } from './parser.js';
import { processImageToSquareWebP } from './image-processor.js';
import { getStudentsByClass } from './db.js';

/**
 * Offizielle IBM CP437-Zeichentabelle für Bytes 0x80 bis 0xFF.
 * Wird verwendet, um Dateinamen aus Windows-Explorer-ZIPs korrekt mit Umlauten zu dekodieren.
 */
const CP437_TABLE = [
  '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', // 80-87: Ç ü é â ä à å ç
  '\u00EA', '\u00EB', '\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', // 88-8F: ê ë è ï î ì Ä Å
  '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9', // 90-97: É æ Æ ô ö ò û ù
  '\u00FF', '\u00D6', '\u00DC', '\u00A2', '\u00A3', '\u00A5', '\u20A7', '\u0192', // 98-9F: ÿ Ö Ü ¢ £ ¥ ₧ ƒ
  '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1', '\u00AA', '\u00BA', // A0-A7: á í ó ú ñ Ñ ª º
  '\u00BF', '\u2310', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', // A8-AF: ¿ ⌐ ¬ ½ ¼ ¡ « »
  '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556', // B0-B7: ░ ▒ ▓ │ ┤ ╡ ╢ ╖
  '\u2557', '\u2563', '\u2555', '\u2553', '\u255B', '\u255C', '\u2552', '\u2510', // B8-BF: ╕ ╣ ║ ╗ ╝ ╜ ╛ ┐
  '\u2514', '\u2534', '\u252C', '\u251C', '\u2500', '\u253C', '\u255E', '\u255F', // C0-C7: └ ┴ ┬ ├ ─ ┼ ╞ ╟
  '\u255A', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256C', '\u2567', // C8-CF: ╚ ╔ ╩ ╦ ╠ ═ ╬ ╧
  '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256B', // D0-D7: ╨ ╤ ╥ ╙ ╘ ╒ ╓ ╫
  '\u256A', '\u2518', '\u250C', '\u2588', '\u2584', '\u258C', '\u2590', '\u2580', // D8-DF: ╪ ┘ ┌ █ ▄ ▌ ▐ ▀
  '\u03B1', '\u00DF', '\u0393', '\u03C0', '\u03A3', '\u03C3', '\u00B5', '\u03C4', // E0-E7: α ß Γ π Σ σ µ τ
  '\u03A6', '\u0398', '\u03A9', '\u03B4', '\u221E', '\u03C6', '\u03B5', '\u2229', // E8-EF: Φ Θ Ω δ ∞ φ ε ∩
  '\u2261', '\u00B1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00F7', '\u2248', // F0-F7: ≡ ± ≥ ≤ ⌠ ⌡ ÷ ≈
  '\u00B0', '\u2219', '\u00B7', '\u221A', '\u207F', '\u00B2', '\u25A0', '\u00A0'  // F8-FF: ° ∙ · √ ⁿ ² ■ NBSP
];

/**
 * Universeller Dateinamen-Decoder für JSZip:
 * Unterstützt UTF-8 (Mac/Linux/7-Zip) sowie CP437/CP850 (Windows Explorer Standard-ZIPs)
 * und Windows-1252 / ISO-8859-1.
 * @param {Uint8Array|Array} bytes
 * @returns {string}
 */
export function decodeZipFilename(bytes) {
  if (!bytes || bytes.length === 0) return '';

  // 1. Zuerst striktes UTF-8 versuchen (erkennt macOS, Linux, moderne ZIPs)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (_) {
    // Kein gültiges UTF-8: Weiter mit DOS / Windows Codepages
  }

  // 2. Prüfen, ob typische DOS/CP437 Zeichen (0x80..0x9A oder 0xE1 für Umlaute) vorhanden sind
  let hasCp437Char = false;
  let hasWin1252Char = false;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 0x80 && b <= 0x9A) || b === 0xE1) hasCp437Char = true;
    if (b === 0xC4 || b === 0xD6 || b === 0xDC || b === 0xE4 || b === 0xF6 || b === 0xFC || b === 0xDF) hasWin1252Char = true;
  }

  // Bei Windows-Explorer-ZIPs greift CP437 (DOS OEM)
  if (hasCp437Char || !hasWin1252Char) {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      str += b < 0x80 ? String.fromCharCode(b) : (CP437_TABLE[b - 0x80] || String.fromCharCode(b));
    }
    return str;
  }

  // 3. Fallback: Windows-1252 / ISO-8859-1
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch (_) {
    try {
      return new TextDecoder('iso-8859-1').decode(bytes);
    } catch (_) {
      let fallbackStr = '';
      for (let i = 0; i < bytes.length; i++) fallbackStr += String.fromCharCode(bytes[i]);
      return fallbackStr;
    }
  }
}

/**
 * Importiert ein Klassen-ZIP-Archiv
 * @param {File|Blob} zipFile
 * @param {string} classId
 * @returns {Promise<{ students: Array, summary: Object }>}
 */
export async function importClassZip(zipFile, classId) {
  if (!window.JSZip) {
    throw new Error('JSZip Bibliothek nicht geladen');
  }

  const zip = await window.JSZip.loadAsync(zipFile, { decodeFileName: decodeZipFilename });
  const imageEntries = [];
  const audioEntries = {};
  let metadataJson = null;

  // 1. Alle Dateien im ZIP durchsuchen
  const fileNames = Object.keys(zip.files);
  for (const filename of fileNames) {
    const entry = zip.files[filename];
    if (entry.dir) continue;

    // System- & versteckte Dateien ignorieren
    if (filename.includes('__MACOSX') || filename.includes('.DS_Store') || filename.includes('Thumbs.db')) {
      continue;
    }

    const lowerName = filename.toLowerCase();

    // Metadaten-JSON erkennen
    if (lowerName.endsWith('metadata.json') || lowerName.endsWith('klasse.json')) {
      try {
        const jsonText = await entry.async('string');
        metadataJson = JSON.parse(jsonText);
      } catch (e) {
        console.warn('Metadaten-JSON konnte nicht gelesen werden', e);
      }
      continue;
    }

    // Bilder filtern
    if (lowerName.endsWith('.webp') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) {
      imageEntries.push(entry);
    }

    // Audios filtern
    if (lowerName.endsWith('.webm') || lowerName.endsWith('.ogg') || lowerName.endsWith('.mp3') || lowerName.endsWith('.m4a') || lowerName.endsWith('.wav')) {
      const baseAudioName = getCleanBasename(filename);
      audioEntries[baseAudioName] = entry;
    }
  }

  if (imageEntries.length === 0) {
    throw new Error('Keine unterstützten Bilddateien (.webp, .jpg, .png) im ZIP gefunden.');
  }

  const students = [];
  let completeCount = 0;
  let needsReviewCount = 0;

  // 2. Bilder parallel/sequenziell verarbeiten
  for (const imgEntry of imageEntries) {
    try {
      const cleanFilename = getCleanBasename(imgEntry.name);
      const rawBlob = await imgEntry.async('blob');
      
      // Auf 600x600 WebP zuschneiden
      const webpBlob = await processImageToSquareWebP(rawBlob);

      // Metadaten ermitteln (aus JSON oder aus Dateinamen geparst)
      let studentMeta = null;
      if (metadataJson && Array.isArray(metadataJson.students)) {
        studentMeta = metadataJson.students.find(s => s.originalFilename === imgEntry.name || s.imageFilename === imgEntry.name.split('/').pop().split('\\').pop() || s.lastName === cleanFilename.split('_')[0]);
      }

      if (!studentMeta) {
        studentMeta = parseFilename(imgEntry.name.split('/').pop().split('\\').pop());
      }

      // Prüfen, ob Audio existiert (Exakter Match oder Name ohne Datum)
      let audioBlob = null;
      const nameKey = `${studentMeta.lastName || ''}_${studentMeta.firstName || ''}`.trim().toLowerCase();
      const matchKey = Object.keys(audioEntries).find(k => {
        const lowerK = k.toLowerCase();
        return lowerK === cleanFilename.toLowerCase() ||
               lowerK === nameKey ||
               (metadataJson && studentMeta.audioFilename && lowerK === getCleanBasename(studentMeta.audioFilename).toLowerCase());
      });

      if (matchKey && audioEntries[matchKey]) {
        const rawAudioBlob = await audioEntries[matchKey].async('blob');
        const entryName = (audioEntries[matchKey].name || '').toLowerCase();
        let mime = 'audio/webm';
        if (entryName.endsWith('.mp3')) mime = 'audio/mpeg';
        else if (entryName.endsWith('.wav')) mime = 'audio/wav';
        else if (entryName.endsWith('.m4a') || entryName.endsWith('.mp4')) mime = 'audio/mp4';
        else if (entryName.endsWith('.ogg')) mime = 'audio/ogg';
        audioBlob = new Blob([rawAudioBlob], { type: mime });
      }

      if (studentMeta.needsReview) {
        needsReviewCount++;
      } else {
        completeCount++;
      }

      const studentId = 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);

      students.push({
        id: studentId,
        classId: classId,
        lastName: studentMeta.lastName || 'Unbekannt',
        firstName: studentMeta.firstName || '',
        birthDate: studentMeta.birthDate || null,
        country: studentMeta.country || '',
        address: studentMeta.address || '',
        phone: studentMeta.phone || '',
        email: studentMeta.email || '',
        mnemonic: studentMeta.mnemonic || '',
        imageBlob: webpBlob,
        audioBlob: audioBlob || null,
        needsReview: !!studentMeta.needsReview,
        leitnerBox: 1,
        lastReviewed: null
      });
    } catch (err) {
      console.error(`Fehler beim Verarbeiten von ${imgEntry.name}:`, err);
    }
  }

  return {
    students,
    summary: {
      total: students.length,
      complete: completeCount,
      needsReview: needsReviewCount
    }
  };
}

/**
 * Exportiert eine Klasse inkl. WebP-Bildern, Audios und JSON-Metadaten als ZIP
 * @param {string} classId
 * @param {string} className
 */
export async function exportClassZip(classId, className) {
  if (!window.JSZip) {
    throw new Error('JSZip Bibliothek nicht geladen');
  }

  const students = await getStudentsByClass(classId);
  if (students.length === 0) {
    throw new Error('Diese Klasse enthält keine Schüler zum Exportieren.');
  }

  const zip = new window.JSZip();
  const metaList = [];

  students.forEach((student, index) => {
    const safeLastName = (student.lastName || 'Unbekannt').replace(/[\\/:*?"<>|]/g, '');
    const safeFirstName = (student.firstName || 'Vorname').replace(/[\\/:*?"<>|]/g, '');
    const dateStr = student.birthDate || '_';

    const baseName = `${safeLastName}_${safeFirstName}_${dateStr}`;
    const imageFilename = `${baseName}.webp`;

    // Bild hinzufügen
    if (student.imageBlob) {
      zip.file(imageFilename, student.imageBlob);
    }

    // Audio hinzufügen falls vorhanden
    let audioFilename = null;
    if (student.audioBlob) {
      const type = (student.audioBlob.type || '').toLowerCase();
      let ext = 'webm';
      if (type.includes('mp3') || type.includes('mpeg')) ext = 'mp3';
      else if (type.includes('wav')) ext = 'wav';
      else if (type.includes('mp4') || type.includes('m4a')) ext = 'm4a';
      else if (type.includes('ogg')) ext = 'ogg';

      audioFilename = `${safeLastName}_${safeFirstName}.${ext}`;
      zip.file(audioFilename, student.audioBlob);
    }

    metaList.push({
      id: student.id,
      lastName: student.lastName,
      firstName: student.firstName,
      birthDate: student.birthDate,
      country: student.country || '',
      address: student.address || '',
      phone: student.phone || '',
      email: student.email || '',
      mnemonic: student.mnemonic || '',
      imageFilename: imageFilename,
      audioFilename: audioFilename,
      leitnerBox: student.leitnerBox || 1,
      lastReviewed: student.lastReviewed || null
    });
  });

  // Metadaten-JSON beilegen
  const exportPayload = {
    className: className,
    exportedAt: new Date().toISOString(),
    students: metaList
  };
  zip.file('klasse.json', JSON.stringify(exportPayload, null, 2));

  // ZIP generieren
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Download auslösen
  const safeClassName = (className || 'Klasse').replace(/[\\/:*?"<>|]/g, '_');
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${safeClassName}_Export.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}

function getCleanBasename(path) {
  const filename = path.split('/').pop().split('\\').pop();
  return filename.replace(/\.[^/.]+$/, '').normalize('NFC').trim();
}
