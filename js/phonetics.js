/**
 * Herkunftssensitives Phonetik- & Standard-Audio-Modul (100% Offline)
 * Erzeugt leicht lesbare deutsche Aussprachehilfen für die 1. Zeile der Eselsbrücke
 * unter Berücksichtigung des Geburtsorts / Herkunftslands und ordnet natürliche
 * Neural-TTS-Audiodateien zu.
 */

export function cleanPhoneticKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\(inaktiv\)/gi, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[éèê]/g, 'e')
    .replace(/[óòô]/g, 'o')
    .replace(/[áàâă]/g, 'a')
    .replace(/ń/g, 'n')
    .replace(/ł/g, 'l')
    .replace(/ț/g, 't')
    .replace(/[șş]/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Kuratierte Lautschriften & Neural-Audio-Zuordnungen für bekannte Schüler
 * Format: [Nachname, Vorname, Lautschrift, Audio-Dateiname]
 */
const CURATED_ENTRIES = [
  ['Abubakir', 'Shko Hemn', '🗣️ [Abu-Bakir, Schko Hemn]', 'abubakir_shkohemn.mp3'],
  ['Ahrweiler', 'Niklas', '🗣️ [Ahr-weiler, Niklas]', 'ahrweiler_niklas.mp3'],
  ['Ak', 'Deniz', '🗣️ [Ak, Denis]', 'ak_deniz.mp3'],
  ['Aldelemie', 'Mustafa', '🗣️ [Al-Delemi, Mustafa]', 'aldelemie_mustafa.mp3'],
  ['Aliiev', 'Tamerlan', '🗣️ [Alijew, Tamerlan]', 'aliiev_tamerlan.mp3'],
  ['Almuazen', 'Mohammed Sadek', '🗣️ [Al-Muasen, Mohammed Sadek]', 'almuazen_mohammedsadek.mp3'],
  ['Altinay', 'Mustafa', '🗣️ [Altinaj, Mustafa]', 'altinay_mustafa.mp3'],
  ['Amirian', 'Armin', '🗣️ [Amir-jan, Armin]', 'amirian_armin.mp3'],
  ['Aydinalp', 'Eymen', '🗣️ [Ajdin-alp, Ejmen]', 'aydinalp_eymen.mp3'],
  ['Balkhi', 'Abdul Razeq', '🗣️ [Balchi, Abdul Rasek]', 'balkhi_abdulrazeq.mp3'],
  ['Barkaoui', 'Abdeljalil', '🗣️ [Barka-ui, Abdel-dschalil]', 'barkaoui_abdeljalil.mp3'],
  ['Bouarif', 'Leon', '🗣️ [Bu-arif, Leon]', 'bouarif_leon.mp3'],
  ['Bozkurt', 'Kerim', '🗣️ [Bos-kurt, Kerim]', 'bozkurt_kerim.mp3'],
  ['Custodis', 'Gianni', '🗣️ [Kustodis, Dschanni]', 'custodis_gianni.mp3'],
  ['Cvetanoski', 'Nino', '🗣️ [Zwetanoski, Nino]', 'cvetanoski_nino.mp3'],
  ['Dizdar', 'Armin', '🗣️ [Disdar, Armin]', 'dizdar_armin.mp3'],
  ['Eralp', 'Hamit', '🗣️ [Er-alp, Hamit]', 'eralp_hamit.mp3'],
  ['Fares', 'Amin', '🗣️ [Fa-res, Amin]', 'fares_amin.mp3'],
  ['Firat', 'Muhammed Selim', '🗣️ [Firat, Muhammed Selim]', 'firat_muhammedselim.mp3'],
  ['Gbaguidi', 'Abdou Gafarou Adebahodoun', '🗣️ [Ba-gidi, Abdu Gafaru Adebahodun]', 'gbaguidi_abdougafarouadebahodoun.mp3'],
  ['Gerhards', 'James', '🗣️ [Ger-hards, Dscheims]', 'gerhards_james.mp3'],
  ['Grabs', 'Aliou', '🗣️ [Grabs, Ali-u]', 'grabs_aliou.mp3'],
  ['Grosu', 'Danut', '🗣️ [Grossu, Danutz]', 'grosu_danut.mp3'],
  ['Guenda', 'Samuel', '🗣️ [Gu-enda, Samuel]', 'guenda_samuel.mp3'],
  ['Günes', 'Musa', '🗣️ [Günesch, Musa]', 'guenes_musa.mp3'],
  ['Hafdhalla', 'Rami Ben', '🗣️ [Hafdalla, Rami Ben]', 'hafdhalla_ramiben.mp3'],
  ['Hamo', 'Ahmad', '🗣️ [Hamo, Achmad]', 'hamo_ahmad.mp3'],
  ['Hamurcu', 'Rüzgar', '🗣️ [Hamurdscu, Rüsgar]', 'hamurcu_ruezgar.mp3'],
  ['Ibrahim', 'Ilona', '🗣️ [Ibra-him, Ilona]', 'ibrahim_ilona.mp3'],
  ['Iskandarov', 'Daniel', '🗣️ [Iskandarow, Daniel]', 'iskandarov_daniel.mp3'],
  ['Jäger', 'Louis', '🗣️ [Jäger, Lui]', 'jaeger_louis.mp3'],
  ['Karga', 'Musa', '🗣️ [Karga, Musa]', 'karga_musa.mp3'],
  ['Keles', 'Zahide Ela', '🗣️ [Kelesch, Sahide Ela]', 'keles_zahideela.mp3'],
  ['Kocyigit', 'Mert', '🗣️ [Kotsch-ji-it, Mert]', 'kocyigit_mert.mp3'],
  ['Konkol', 'Christopher', '🗣️ [Konkol, Kristoffer]', 'konkol_christopher.mp3'],
  ['Kostin', 'Maksym', '🗣️ [Kostin, Maksim]', 'kostin_maksym.mp3'],
  ['Köse', 'Ömer Kayra', '🗣️ [Kösse, Ömer Kajra]', 'koese_oemerkayra.mp3'],
  ['Lamsfuß', 'Jan', '🗣️ [Lams-fuß, Jan]', 'lamsfuss_jan.mp3'],
  ['Loza', 'Bohdan', '🗣️ [Losa, Bochdan]', 'loza_bohdan.mp3'],
  ['Merk', 'Miko', '🗣️ [Merk, Miko]', 'merk_miko.mp3'],
  ['Mirahki', 'Parniya', '🗣️ [Mirachki, Parnija]', 'mirahki_parniya.mp3'],
  ['Mitlehner', 'Alex', '🗣️ [Mit-lehner, Alex]', 'mitlehner_alex.mp3'],
  ['Muradyan', 'Ruben', '🗣️ [Murad-jan, Ruben]', 'muradyan_ruben.mp3'],
  ['Nguyen', 'Thong Kendy Ly', '🗣️ [Ngu-jen, Tong Kendi Li]', 'nguyen_thongkendyly.mp3'],
  ['Novytskyi', 'Oleksandr', '🗣️ [Nowitzki, Oleksandr]', 'novytskyi_oleksandr.mp3'],
  ['Olenberger', 'Leonard', '🗣️ [Olen-berger, Leonard]', 'olenberger_leonard.mp3'],
  ['Pawlowski', 'Gabriel', '🗣️ [Paw-wowski, Gabriel]', 'pawlowski_gabriel.mp3'],
  ['Pawlowski', 'David', '🗣️ [Paw-wowski, Dawid]', 'pawlowski_david.mp3'],
  ['Pies', 'Johannes', '🗣️ [Pies (langes i), Johannes]', 'pies_johannes.mp3'],
  ['Quartier', 'Jan', '🗣️ [Kwar-tier, Jan]', 'quartier_jan.mp3'],
  ['Sabri', 'Amin', '🗣️ [Sabri, Amin]', 'sabri_amin.mp3'],
  ['Sahin', 'Yalin', '🗣️ [Schahin, Jalin]', 'sahin_yalin.mp3'],
  ['Sahin', 'Koray', '🗣️ [Schahin, Koraj]', 'sahin_koray.mp3'],
  ['Saretzki', 'Rayan', '🗣️ [Sa-retzki, Rajan]', 'saretzki_rayan.mp3'],
  ['Sbii', 'Nizar', '🗣️ [Sbi-i, Nisar]', 'sbii_nizar.mp3'],
  ['Scarano', 'Leo', '🗣️ [Ska-rano, Leo]', 'scarano_leo.mp3'],
  ['Schellenberg', 'Wilhelm', '🗣️ [Schellen-berg, Wilhelm]', 'schellenberg_wilhelm.mp3'],
  ['Solonskyi', 'Bohdan', '🗣️ [Solonski, Bochdan]', 'solonskyi_bohdan.mp3'],
  ['Storm', 'Sascha', '🗣️ [Storm, Sascha]', 'storm_sascha.mp3'],
  ['Suvalic', 'Edin', '🗣️ [Schu-walitsch, Edin]', 'suvalic_edin.mp3'],
  ['Szymanski', 'Kacper Mariusz', '🗣️ [Schi-manski, Katzper Mariusch]', 'szymanski_kacpermariusz.mp3'],
  ['Tekman', 'Eyüp', '🗣️ [Tek-man, Ejüp]', 'tekman_eyuep.mp3'],
  ['Timmer', 'Ravi', '🗣️ [Timmer, Rawi]', 'timmer_ravi.mp3'],
  ['Trude', 'Adrian', '🗣️ [Tru-de, Adrian]', 'trude_adrian.mp3'],
  ['Uko', 'Onyeka Favour', '🗣️ [U-ko, On-jeka Fejwör]', 'uko_onyekafavour.mp3'],
  ['Uygur', 'Efe Can', '🗣️ [Uj-gur, Efe Dschan]', 'uygur_efecan.mp3'],
  ['Walter', 'Tamino', '🗣️ [Walter, Tamino]', 'walter_tamino.mp3'],
  ['Weber', 'León-Felipe', '🗣️ [Weber, Le-on Fe-lipe]', 'weber_leonfelipe.mp3'],
  ['Weidauer', 'Sebastian', '🗣️ [Wei-dauer, Sebastian]', 'weidauer_sebastian.mp3'],
  ['Wittkowski', 'Jonas', '🗣️ [Witt-kowski, Jonas]', 'wittkowski_jonas.mp3'],
  ['Yildirim', 'Talha Mahmut', '🗣️ [Jildirim, Talha Machmut]', 'yildirim_talhamahmut.mp3'],
  ['Öztürk', 'Ahmed Yahya', '🗣️ [Ös-türk, Achmed Jahja]', 'oeztuerk_ahmedyahya.mp3'],
  ['Özüyilmaz', 'Akif Zeki', '🗣️ [Ös-ü-jilmas, Akif Seki]', 'oezueyilmaz_akifzeki.mp3'],
  ['Becker', 'Thomas Michael', '🗣️ [Becker, Thomas Michael]', 'becker_thomasmichael.mp3'],
  ['Müller', 'Jörg', '🗣️ [Müller, Jörg]', 'mueller_joerg.mp3'],
  ['Müller Schmitz', 'Petra', '🗣️ [Müller-Schmitz, Petra]', 'muellerschmitz_petra.mp3'],
  ['Müller', 'Petra Melanie', '🗣️ [Müller, Petra Melanie]', 'mueller_petramelanie.mp3'],
  ['Schneider', 'Lukas', '🗣️ [Schneider, Lukas]', 'schneider_lukas.mp3']
];

const PHONETICS_BY_FULL = {};
const PHONETICS_BY_LAST = {};
const AUDIO_BY_FULL = {};
const AUDIO_BY_LAST = {};

for (const [last, first, phon] of CURATED_ENTRIES) {
  const fullK = cleanPhoneticKey(`${last}_${first}`);
  const lastK = cleanPhoneticKey(last);
  const url = `./audio_defaults/${fullK}.mp3`;

  PHONETICS_BY_FULL[fullK] = phon;
  AUDIO_BY_FULL[fullK] = url;

  if (!PHONETICS_BY_LAST[lastK]) PHONETICS_BY_LAST[lastK] = phon;
  if (!AUDIO_BY_LAST[lastK]) AUDIO_BY_LAST[lastK] = url;

  // Kurzformen des Vornamens ebenfalls registrieren
  const firstToken = (first || '').split(/[\s,]+/)[0];
  if (firstToken && firstToken !== first) {
    const shortK = cleanPhoneticKey(`${last}_${firstToken}`);
    PHONETICS_BY_FULL[shortK] = phon;
    AUDIO_BY_FULL[shortK] = url;
  }
}

// Spezielle Alias-Zuordnungen (z. B. gedrehte Namen oder Kurzformen)
PHONETICS_BY_FULL[cleanPhoneticKey('Schellenberg_Wil')] = PHONETICS_BY_LAST[cleanPhoneticKey('Schellenberg')];
AUDIO_BY_FULL[cleanPhoneticKey('Schellenberg_Wil')] = AUDIO_BY_LAST[cleanPhoneticKey('Schellenberg')];
PHONETICS_BY_FULL[cleanPhoneticKey('Shko_Hemn Abubakir')] = PHONETICS_BY_LAST[cleanPhoneticKey('Abubakir')];
AUDIO_BY_FULL[cleanPhoneticKey('Shko_Hemn Abubakir')] = AUDIO_BY_LAST[cleanPhoneticKey('Abubakir')];
PHONETICS_BY_FULL[cleanPhoneticKey('Sabri Sabr_Amin')] = PHONETICS_BY_LAST[cleanPhoneticKey('Sabri')];
AUDIO_BY_FULL[cleanPhoneticKey('Sabri Sabr_Amin')] = AUDIO_BY_LAST[cleanPhoneticKey('Sabri')];

/**
 * Erkennt den Sprachraum anhand von Herkunftsland/Geburtsort und typischen Namensmustern
 */
function detectLanguageOrigin(lastName, firstName, country) {
  const c = String(country || '').toLowerCase();
  const full = `${lastName} ${firstName}`.toLowerCase();

  if (/türkei|turkey|istanbul|ankara|izmir|bahcelievler|antalya|konya/.test(c)) return 'tr';
  if (/polen|poland|slawno|warszawa|warschau|krakau|gdansk|poznan|wroclaw/.test(c)) return 'pl';
  if (/ukraine|dnipro|charkiw|kharkiv|kiew|kyiv|zastarna|odessa|lviv|russland|belarus/.test(c)) return 'ua';
  if (/mazedonien|skopje|serbien|belgrad|kroatien|zagreb|bosnien|sarajevo|montenegro|kosovo|slowenien/.test(c)) return 'balkan';
  if (/irak|iraq|sulaimaniyya|bagdad|erbil|syrien|damaskus|aleppo|homs|libanon|beirut|jordanien|ägypten|kairo|marokko|tunesien|algerien|arabien/.test(c)) return 'ar';
  if (/vietnam|hanoi|saigon/.test(c)) return 'vi';
  if (/frankreich|france|paris|benin|godomey|senegal|dakar|kamerun|elfenbeinküste|mali|guinea|togo|kongo/.test(c)) return 'fr';
  if (/rumänien|romania|bukarest|cluj|timisoara|moldau/.test(c)) return 'ro';
  if (/nigeria|lagos|abuja|ghana|accra|kenia|südafrika|singapur|usa|england|uk|großbritannien/.test(c)) return 'en';
  if (/italien|rom|mailand|neapel/.test(c)) return 'it';
  if (/spanien|madrid|barcelona|mexiko|kolumbien|argentinien/.test(c)) return 'es';

  // Fallback über typische Namensmuster, falls Geburtsort in Deutschland (z. B. Köln) liegt
  if (/[ğşı]|öz|yıl|oğlu|bozkurt|hamurcu|uygur|kocyigit|tekman|aydinalp|altinay|günes|keles|eralp|sahin/.test(full)) return 'tr';
  if (/sz|cz|rz|ł|ń|ski\b|cki\b|wicz\b/.test(full)) return 'pl';
  if (/iiev\b|yev\b|tskyi\b|skyi\b|ov\b|kostin|loza/.test(full)) return 'ua';
  if (/cvet|ic\b|ić\b/.test(full)) return 'balkan';
  if (/\b(abdul|ahmad|ahmed|mohammed|muhammed|almuazen|abubakir|aldelemie|hafdhalla|barkaoui)\b/.test(full)) return 'ar';
  if (/\b(nguyen|tran|pham|le|huynh|thong)\b/.test(full)) return 'vi';
  if (/\b(aliou|abdou|gbaguidi|bouarif|louis)\b/.test(full)) return 'fr';
  if (/\b(grosu|danut)\b/.test(full)) return 'ro';

  return 'de';
}

/**
 * Wandelt einen einzelnen Namenstoken anhand des erkannten Sprachraums in deutsche Lautschrift um
 */
function transcribeWord(word, lang) {
  if (!word) return '';
  let w = word.trim();

  if (lang === 'tr') {
    w = w
      .replace(/ğ/gi, '-')
      .replace(/ç/g, 'tsch').replace(/Ç/g, 'Tsch')
      .replace(/ş/g, 'sch').replace(/Ş/g, 'Sch')
      .replace(/c/g, 'dsch').replace(/C/g, 'Dsch')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/y([aäeioöuü])/gi, 'j$1')
      .replace(/([aäeioöuü])y/gi, '$1j')
      .replace(/z/g, 's').replace(/Z/g, 'S')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'pl') {
    w = w
      .replace(/sz/g, 'sch').replace(/Sz/g, 'Sch')
      .replace(/cz/g, 'tsch').replace(/Cz/g, 'Tsch')
      .replace(/rz/g, 'sch').replace(/Rz/g, 'Sch')
      .replace(/ł/g, 'w').replace(/Ł/g, 'W')
      .replace(/ń/g, 'n')
      .replace(/c([aäeioöuüpk])/gi, 'tz$1');
  } else if (lang === 'ua') {
    w = w
      .replace(/iiev\b/gi, 'ijew')
      .replace(/yev\b/gi, 'jew')
      .replace(/ov\b/gi, 'ow')
      .replace(/ev\b/gi, 'ew')
      .replace(/tskyi\b/gi, 'tzki')
      .replace(/skyi\b/gi, 'ski')
      .replace(/kh/gi, 'ch')
      .replace(/zh/gi, 'sch')
      .replace(/y/g, 'i');
  } else if (lang === 'balkan') {
    w = w
      .replace(/^Cv/g, 'Zw').replace(/^cv/g, 'zw')
      .replace(/ic\b/gi, 'itsch')
      .replace(/ić\b/gi, 'itsch')
      .replace(/v/g, 'w').replace(/V/g, 'W');
  } else if (lang === 'ar') {
    w = w
      .replace(/sh/g, 'sch').replace(/Sh/g, 'Sch')
      .replace(/kh/g, 'ch').replace(/Kh/g, 'Ch')
      .replace(/gh/g, 'g').replace(/Gh/g, 'G')
      .replace(/ou/g, 'u')
      .replace(/y([aäeioöuü])/gi, 'j$1')
      .replace(/z/g, 's').replace(/Z/g, 'S');
  } else if (lang === 'vi') {
    w = w
      .replace(/^Nguyen$/i, 'Ngu-jen')
      .replace(/^Th/g, 'T')
      .replace(/y/g, 'i');
  } else if (lang === 'fr') {
    w = w
      .replace(/^Gb/g, 'B')
      .replace(/ou/g, 'u').replace(/Ou/g, 'U')
      .replace(/eau/g, 'o')
      .replace(/^Louis$/i, 'Lui');
  } else if (lang === 'ro') {
    w = w
      .replace(/ț/g, 'tz')
      .replace(/ș/g, 'sch')
      .replace(/ă/g, 'a');
  }

  return w;
}

/**
 * Gibt die passende Lautschrift-Zeile ("🗣️ [Nachname, Vorname]") für einen Schüler zurück
 */
export function getPhoneticLine(lastName, firstName, country = '') {
  const cleanLast = String(lastName || '').replace(/\(inaktiv\)/gi, '').trim();
  const cleanFirst = String(firstName || '').trim();

  if (!cleanLast && !cleanFirst) return '';

  const fullK = cleanPhoneticKey(`${cleanLast}_${cleanFirst}`);
  const lastK = cleanPhoneticKey(cleanLast);

  if (PHONETICS_BY_FULL[fullK]) {
    return PHONETICS_BY_FULL[fullK];
  }
  if (PHONETICS_BY_LAST[lastK] && !cleanFirst) {
    return PHONETICS_BY_LAST[lastK];
  }
  if (PHONETICS_BY_LAST[lastK]) {
    // Falls Nachname bekannt, aber Vorname leicht abweichend geschrieben
    return PHONETICS_BY_LAST[lastK];
  }

  // Regelbasierter Fallback für neue/unbekannte Schüler unter Nutzung des Herkunftslands
  const lang = detectLanguageOrigin(cleanLast, cleanFirst, country);
  const phonLast = cleanLast.split(/\s+/).map(w => transcribeWord(w, lang)).join(' ');
  const phonFirst = cleanFirst.split(/\s+/).map(w => transcribeWord(w, lang)).join(' ');

  return phonFirst ? `🗣️ [${phonLast}, ${phonFirst}]` : `🗣️ [${phonLast}]`;
}

/**
 * Stellt sicher, dass in der 1. Zeile der Eselsbrücke immer die Lautschrift steht,
 * ohne bestehende eigene Notizen in den Folgezeilen zu überschreiben.
 */
export function ensurePhoneticInMnemonic(currentMnemonic, lastName, firstName, country = '', forceRefresh = false) {
  const phoneticLine = getPhoneticLine(lastName, firstName, country);
  if (!phoneticLine) return currentMnemonic || '';

  const raw = String(currentMnemonic || '').trim();
  if (!raw) {
    return phoneticLine;
  }

  const lines = raw.split(/\r?\n/);
  const firstLine = lines[0].trim();

  // Falls Zeile 1 bereits eine Lautschrift-Zeile ist ("🗣️ [...]" oder "[...]"):
  if (firstLine.startsWith('🗣️') || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
    if (forceRefresh) {
      lines[0] = phoneticLine;
      return lines.join('\n');
    }
    return raw;
  }

  // Andernfalls Lautschrift in Zeile 1 setzen und bestehende Eselsbrücke darunter erhalten
  return `${phoneticLine}\n${raw}`;
}

/**
 * Liefert die URL zur vorab generierten Neural-TTS-Audiodatei (falls für diesen Namen vorhanden)
 */
export function getDefaultAudioUrl(lastName, firstName) {
  const cleanLast = String(lastName || '').replace(/\(inaktiv\)/gi, '').trim();
  const cleanFirst = String(firstName || '').trim();

  const fullK = cleanPhoneticKey(`${cleanLast}_${cleanFirst}`);
  const lastK = cleanPhoneticKey(cleanLast);

  if (AUDIO_BY_FULL[fullK]) return AUDIO_BY_FULL[fullK];
  if (AUDIO_BY_LAST[lastK]) return AUDIO_BY_LAST[lastK];
  return null;
}

export function getAllDefaultAudioUrls() {
  return Array.from(new Set(Object.values(AUDIO_BY_FULL)));
}
