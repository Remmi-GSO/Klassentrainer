/**
 * Dateinamen- und Datums-Parser mit maximaler Fehlertoleranz & Unicode-Bereinigung.
 * Unterstützt Leerzeichen, Unterstriche, Kommas und Bindestriche:
 * - "Müller Jörg 2008-05-14.jpg"
 * - "Müller Jörg 14.05.2008.jpg"
 * - "Müller Jörg.jpg"
 * - "Müller_Jörg_2008-05-14.webp"
 * - "Müller, Jörg 2008-05-14.jpg"
 */

/**
 * Parst einen Dateinamen und extrahiert Nachname, Vorname und Geburtsdatum.
 * @param {string} rawFilename - Z.B. "Müller Jörg 2008-05-14.jpg"
 * @returns {Object} { lastName, firstName, birthDate, needsReview }
 */
export function parseFilename(rawFilename) {
  if (!rawFilename) {
    return { lastName: 'Unbekannt', firstName: '', birthDate: null, needsReview: true };
  }

  // 1. Dateiendung entfernen & Unicode NFC normalisieren (Umlaute reparieren)
  let cleanName = rawFilename
    .replace(/\.[^/.]+$/, '') // Dateiendung weg
    .replace(/[\x00-\x1F\x7F]/g, '') // Unsichtbare Steuerzeichen entfernen
    .normalize('NFC')
    .trim();

  // 2. Datum aus dem String extrahieren (falls vorhanden)
  let birthDate = null;

  // Suche nach ISO (YYYY-MM-DD), DE (DD.MM.YYYY oder DD-MM-YYYY)
  const dateRegex = /(\b\d{4}[-.]\d{1,2}[-.]\d{1,2}\b|\b\d{1,2}[.-]\d{1,2}[.-]\d{4}\b|\b(19\d{2}|20\d{2})\b)/;
  const dateMatch = cleanName.match(dateRegex);

  if (dateMatch) {
    birthDate = parseDateString(dateMatch[0]);
    // Datum aus dem Namen entfernen
    cleanName = cleanName.replace(dateMatch[0], '').trim();
  }

  let lastName = '';
  let firstName = '';
  let needsReview = false;

  // 3. Namen bereinigen und trennen
  if (cleanName.includes(',')) {
    // Eindeutige Komma-Trennung: Alles vor dem Komma = Nachname(n), danach = Vorname(n)
    // Z. B. "Müller Schmitz, Petra" oder "Müller, Petra Melanie"
    const commaParts = cleanName.split(',').map(p => p.trim()).filter(Boolean);
    lastName = commaParts[0] || 'Unbekannt';
    firstName = commaParts.slice(1).join(' ');
    needsReview = !firstName; // Nur wenn Vorname nach dem Komma fehlt
  } else if (cleanName.includes('_')) {
    // Eindeutige Unterstrich-Trennung: Z. B. "Müller Schmitz_Petra"
    const underParts = cleanName.split('_').map(p => p.trim()).filter(Boolean);
    lastName = underParts[0] || 'Unbekannt';
    firstName = underParts.slice(1).join(' ');
    needsReview = !firstName;
  } else if (cleanName.includes(' - ')) {
    // Eindeutige Bindestrich-Trennung: Z. B. "Müller Schmitz - Petra Melanie"
    const dashParts = cleanName.split(' - ').map(p => p.trim()).filter(Boolean);
    lastName = dashParts[0] || 'Unbekannt';
    firstName = dashParts.slice(1).join(' ');
    needsReview = !firstName;
  } else {
    // Leerzeichen-Trennung
    const spaceParts = cleanName.split(/\s+/).map(p => p.trim()).filter(Boolean);
    
    if (spaceParts.length === 2) {
      // Eindeutiger Standardfall: 1 Nachname, 1 Vorname (z. B. "Müller Petra")
      lastName = spaceParts[0];
      firstName = spaceParts[1];
      needsReview = false;
    } else if (spaceParts.length > 2) {
      // Mehr als 2 Namen OHNE Komma (z. B. "Müller Schmitz Petra" oder "Müller Petra Melanie")
      // Bester Schätzwert: 1. Wort Nachname, Rest Vorname -> aber zur Kontrolle markieren!
      lastName = spaceParts[0];
      firstName = spaceParts.slice(1).join(' ');
      needsReview = true;
    } else if (spaceParts.length === 1) {
      const single = spaceParts[0];
      if (/^IMG|^DSC|^PEXELS|^UNSPLASH|^PHOTO/i.test(single)) {
        lastName = 'Nachname';
        firstName = 'Vorname';
        needsReview = true;
      } else {
        lastName = single;
        firstName = '';
        needsReview = true;
      }
    } else {
      lastName = 'Unbekannt';
      firstName = '';
      needsReview = true;
    }
  }

  // Sicherheits-Fallback
  if (!lastName) lastName = 'Unbekannt';

  // VJ / Volljährig-Status niemals als Vor- oder Nachname übernehmen
  if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(firstName.trim())) {
    firstName = '';
    needsReview = true;
  }
  if (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(lastName.trim())) {
    lastName = 'Unbekannt';
    needsReview = true;
  }

  return {
    lastName,
    firstName,
    birthDate,
    needsReview
  };
}

/**
 * Parst verschiedene Datumsformate in ein standardisiertes 'YYYY-MM-DD'
 * Akzeptiert: YYYY-MM-DD, DD.MM.YYYY, DD-MM-YYYY, YYYY
 */
export function parseDateString(str) {
  if (!str) return null;
  const cleaned = str.trim();

  // Format: YYYY-MM-DD oder YYYY.MM.DD
  const isoMatch = cleaned.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    if (isValidDate(year, month, day)) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format: DD.MM.YYYY oder DD-MM-YYYY
  const deMatch = cleaned.match(/^(\d{1,2})[.-](\d{1,2})[.-](\d{4})$/);
  if (deMatch) {
    const day = String(parseInt(deMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(deMatch[2], 10)).padStart(2, '0');
    const year = parseInt(deMatch[3], 10);
    if (isValidDate(year, month, day)) {
      return `${year}-${month}-${day}`;
    }
  }

  // Nur Geburtsjahr angegeben: YYYY (z.B. 2009) -> Standardisiere auf 01.01.YYYY
  const yearOnlyMatch = cleaned.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1], 10);
    if (year > 1900 && year <= new Date().getFullYear()) {
      return `${year}-01-01`;
    }
  }

  return null;
}

function isValidDate(year, month, day) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  const date = new Date(y, m, d);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
}

/**
 * Berechnet das exakte Alter in Jahren basierend auf dem aktuellen Datum
 * @param {string|null} birthDateStr - Format 'YYYY-MM-DD'
 * @returns {string} Alter (z.B. "16 Jahre") oder "_" wenn unbekannt
 */
export function calculateAge(birthDateStr) {
  if (!birthDateStr) return '_';

  // ISO Format YYYY-MM-DD
  let y = null, m = null, d = null;
  const isoMatch = birthDateStr.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    y = parseInt(isoMatch[1], 10);
    m = parseInt(isoMatch[2], 10) - 1;
    d = parseInt(isoMatch[3], 10);
  } else {
    // Deutsches Format DD.MM.YYYY
    const deMatch = birthDateStr.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
    if (deMatch) {
      d = parseInt(deMatch[1], 10);
      m = parseInt(deMatch[2], 10) - 1;
      y = parseInt(deMatch[3], 10);
    }
  }

  if (y === null) return '_';

  const birthDate = new Date(y, m, d);
  if (isNaN(birthDate.getTime())) return '_';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? `${age} Jahre` : '_';
}

/**
 * Formatiert YYYY-MM-DD für die deutsche Anzeige (DD.MM.YYYY)
 * Garantiert, dass ausschließlich das reine Datum (ohne Orte oder Text) angezeigt wird
 */
export function formatDateDisplay(birthDateStr) {
  if (!birthDateStr) return '_';
  
  const isoMatch = birthDateStr.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const dd = String(isoMatch[3]).padStart(2, '0');
    const mm = String(isoMatch[2]).padStart(2, '0');
    return `${dd}.${mm}.${isoMatch[1]}`;
  }

  const deMatch = birthDateStr.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
  if (deMatch) {
    const dd = String(deMatch[1]).padStart(2, '0');
    const mm = String(deMatch[2]).padStart(2, '0');
    return `${dd}.${mm}.${deMatch[3]}`;
  }

  return birthDateStr;
}
