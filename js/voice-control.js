/**
 * Sprachsteuerung & Sprachnavigation (Web Speech API)
 * Ermöglicht freihändige Navigation und Bewertung beim Autofahren
 */

let recognition = null;
let isListening = false;
let shouldKeepListening = false;
let audioCtx = null;
let callbacks = {};

/**
 * Prüft, ob der Browser die Web Speech API unterstützt
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Erzeugt einen sanften Bestätigungston (Web Audio API Synthesizer)
 * @param {'success'|'start'|'stop'} type
 */
export function playChime(type = 'success') {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      // Zweiklang (aufsteigend) als Bestätigung für verstandenen Befehl
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(784, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'start') {
      // Weicher Start-Ton
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'stop') {
      // Absteigender Stopp-Ton
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (err) {
    // AudioContext auf manchen Geräten vor Interaktion gesperrt
  }
}

/**
 * Initialisiert das Spracherkennungs-Modul
 * @param {Object} options
 * @param {Function} options.onCommand - callback(action, transcript)
 * @param {Function} options.onStatusChange - callback(isActive, statusText)
 * @param {Function} options.onError - callback(errorMsg)
 */
export function initVoiceControl(options = {}) {
  callbacks = options;
  if (!isSpeechRecognitionSupported()) {
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = 'de-DE';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange(true, 'Höre zu...');
    }
  };

  recognition.onend = () => {
    isListening = false;
    // Automatisch wieder verbinden, solange die Sprachsteuerung aktiv bleiben soll (wichtig bei Autofahrten!)
    if (shouldKeepListening) {
      try {
        recognition.start();
      } catch (_) {
        setTimeout(() => {
          if (shouldKeepListening) {
            try { recognition.start(); } catch (_) {}
          }
        }, 300);
      }
    } else if (callbacks.onStatusChange) {
      callbacks.onStatusChange(false, 'Aus');
    }
  };

  recognition.onerror = (event) => {
    console.warn('SpeechRecognition Fehler:', event.error);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      shouldKeepListening = false;
      isListening = false;
      if (callbacks.onError) {
        callbacks.onError('Mikrofonzugriff verweigert oder Spracherkennung nicht erlaubt.');
      }
      if (callbacks.onStatusChange) {
        callbacks.onStatusChange(false, 'Fehler');
      }
    }
  };

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    if (!lastResult || !lastResult[0]) return;

    const transcript = lastResult[0].transcript.trim().toLowerCase();
    processSpokenCommand(transcript);
  };

  return true;
}

/**
 * Startet die kontinuierliche Sprachsteuerung
 */
export function startVoiceControl() {
  if (!recognition && !initVoiceControl(callbacks)) {
    if (callbacks.onError) {
      callbacks.onError('Spracherkennung wird von diesem Browser leider nicht unterstützt.');
    }
    return false;
  }

  shouldKeepListening = true;
  try {
    recognition.start();
    playChime('start');
    return true;
  } catch (err) {
    if (isListening) return true;
    console.warn('SpeechRecognition start() Fehler:', err);
    return false;
  }
}

/**
 * Beendet die Sprachsteuerung
 */
export function stopVoiceControl() {
  shouldKeepListening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (_) {}
  }
  isListening = false;
  playChime('stop');
  if (callbacks.onStatusChange) {
    callbacks.onStatusChange(false, 'Aus');
  }
}

/**
 * Schaltet die Sprachsteuerung um (Toggle)
 */
export function toggleVoiceControl() {
  if (shouldKeepListening || isListening) {
    stopVoiceControl();
    return false;
  } else {
    return startVoiceControl();
  }
}

export function isVoiceControlActive() {
  return shouldKeepListening || isListening;
}

/**
 * Analysiert den gesprochenen Satz und löst den passenden Befehl aus
 * @param {string} text - Gesprochener deutscher Text
 */
function processSpokenCommand(text) {
  if (!text) return;
  const clean = text.toLowerCase().trim();

  // 1. Box 1: Nicht gewusst (Rot)
  if (/(nicht gewusst|gar nicht|falsch|rot|nochmal|noch mal|wiederholen|keine ahnung|weiss nicht|weiß nicht|box 1|box eins)/i.test(clean)) {
    triggerCommand('rate_box_1', 'Nicht gewusst ❌', clean);
    return;
  }

  // 2. Box 2: Wackelig / Geht so (Gelb)
  if (/(wackelig|geht so|mittel|gelb|unsicher|schwierig|halb|so lala|box 2|box zwei)/i.test(clean)) {
    triggerCommand('rate_box_2', 'Wackelig / Geht so ⚠️', clean);
    return;
  }

  // 3. Box 3: Gewusst (Grün)
  if (/(gewusst|sicher|gut|grün|gruen|richtig|ja|klar|gewusst sicher|box 3|box drei)/i.test(clean)) {
    triggerCommand('rate_box_3', 'Gewusst ✅', clean);
    return;
  }

  // 4. Box 4: Kann raus (Blau / Weglegen)
  if (/(kann raus|raus|weglegen|meister|gemeistert|perfekt|blau|sitzt|fertig|rausnehmen|box 4|box vier)/i.test(clean)) {
    triggerCommand('rate_box_4', 'Kann raus 📥', clean);
    return;
  }

  // 5. Name / Aufdecken
  if (/(name|aufdecken|wer ist das|zeige name|sag name|wer)/i.test(clean)) {
    triggerCommand('reveal_name', 'Name aufdecken 👁️', clean);
    return;
  }

  // 6. Aussprache / Standardton
  if (/(ton|aussprache|abspielen|vorsprechen|play|audio|hör|hoer|sprich)/i.test(clean)) {
    triggerCommand('play_audio', 'Aussprache abspielen 🔊', clean);
    return;
  }

  // 7. Eselsbrücke / Lautschrift
  if (/(eselsbrücke|eselsbruecke|tipp|hinweis|lautschrift|leuchte)/i.test(clean)) {
    triggerCommand('toggle_mnemonic', 'Eselsbrücke 💡', clean);
    return;
  }

  // 8. Karte Umdrehen
  if (/(umdrehen|drehen|karte drehen|rückseite|rueckseite|vorderseite|foto|umdreh)/i.test(clean)) {
    triggerCommand('flip_card', 'Karte drehen 🔄', clean);
    return;
  }

  // 9. Nächste Karte / Vorwärts
  if (/(weiter|nächste|naechste|nächster|naechster|nächstes|vor|vorwärts|vorwaerts|next)/i.test(clean)) {
    triggerCommand('next_card', 'Weiter ⏭️', clean);
    return;
  }

  // 10. Vorherige Karte / Zurück
  if (/(zurück|zurueck|vorherige|vorheriger|vorheriges|rückwärts|rueckwaerts|back)/i.test(clean)) {
    triggerCommand('prev_card', 'Zurück ⏮️', clean);
    return;
  }

  // 11. Stopp / Pause
  if (/(stopp|stoppen|pause|beenden|aufhören|aufhoeren|stumm|schlaf)/i.test(clean)) {
    stopVoiceControl();
    if (callbacks.onCommand) {
      callbacks.onCommand('stop', 'Sprachsteuerung pausiert 🛑');
    }
    return;
  }

  // Unbekannter Sprachbefehl -> kurz anzeigen zur Orientierung
  if (callbacks.onStatusChange) {
    callbacks.onStatusChange(true, `„${clean}“?`);
  }
}

function triggerCommand(action, label, transcript) {
  playChime('success');
  if (callbacks.onCommand) {
    callbacks.onCommand(action, label, transcript);
  }
}
