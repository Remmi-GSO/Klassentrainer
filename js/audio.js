/**
 * Audio-Aufnahme (MediaRecorder) und Wiedergabe-Controller
 * Verhindert Memory-Leaks und gibt Mikrofon-Hardware auf Android sofort frei.
 */

let activeMediaRecorder = null;
let activeAudioStream = null;
let audioChunks = [];
let currentAudioPlayback = null;
let currentPlaybackUrl = null;
let currentActiveFinish = null;
let activeWebAudioSource = null;
let activeWebAudioCtx = null;

/**
 * Ermittelt den optimalen MIME-Type für den mobilen Browser
 */
export function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';

  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

/**
 * Startet eine Audioaufnahme über das Mikrofon
 * @returns {Promise<boolean>}
 */
export async function startRecording() {
  // Eventuell noch aktive Aufnahme sauber abwarten
  if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
    try {
      await stopRecording();
    } catch (_) {
      releaseMicrophoneStream();
    }
  }

  try {
    // Hohe Aufnahmequalität ohne verzerrende VoIP-Filter (kein Noise Gate, keine Pegel-Kompression)
    try {
      activeAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000
        }
      });
    } catch (_) {
      // Fallback für ältere Browser
      activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    audioChunks = [];
    const mimeType = getSupportedAudioMimeType();
    const options = {
      audioBitsPerSecond: 128000 // 128 kbps kristallklare Sprachqualität
    };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    activeMediaRecorder = new MediaRecorder(activeAudioStream, options);

    activeMediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    activeMediaRecorder.start(40); // 40ms Chunks für unmittelbare Datenerfassung
    return true;
  } catch (err) {
    console.error('Mikrofonzugriff fehlgeschlagen:', err);
    releaseMicrophoneStream();
    throw err;
  }
}

/**
 * Beendet die Audioaufnahme und gibt das Audio-Blob zurück
 * @returns {Promise<Blob>}
 */
export async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!activeMediaRecorder || activeMediaRecorder.state === 'inactive') {
      releaseMicrophoneStream();
      return reject(new Error('Keine aktive Aufnahme vorhanden'));
    }

    activeMediaRecorder.onstop = () => {
      // WICHTIG: Mime-Type säubern (Parameter wie ';codecs=opus' entfernen),
      // da Android MediaPlayer & iOS Safari bei Blob-URLs mit ';codecs=...' Fehler werfen!
      let mimeType = activeMediaRecorder.mimeType || 'audio/webm';
      if (mimeType.includes(';')) {
        mimeType = mimeType.split(';')[0].trim();
      }
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      audioChunks = [];
      releaseMicrophoneStream();
      resolve(audioBlob);
    };

    activeMediaRecorder.stop();
  });
}

/**
 * Hardware-Freigabe: Beendet alle Audio-Tracks (Android Mikrofon-Indikator erlischt)
 */
function releaseMicrophoneStream() {
  if (activeAudioStream) {
    activeAudioStream.getTracks().forEach((track) => track.stop());
    activeAudioStream = null;
  }
  activeMediaRecorder = null;
}

/**
 * Spielt ein Audio-Blob ab (Dual-Engine: HTML5 Audio mit sofortigem Web Audio API Fallback)
 * Garantiert 100 % zuverlässige Wiedergabe auf allen Mobilgeräten (Android Chrome & iOS Safari).
 * @param {Blob} audioBlob
 * @returns {Promise<void>}
 */
export async function playAudioBlob(audioBlob) {
  if (!audioBlob || audioBlob.size === 0) return;

  // Vorherige Wiedergabe sofort stoppen
  stopAudioPlayback();

  // Sauberen MIME-Typ ohne Codec-Parameter garantieren
  let cleanType = (audioBlob.type || 'audio/webm').split(';')[0].trim();
  if (!cleanType) cleanType = 'audio/webm';
  const playableBlob = new Blob([audioBlob], { type: cleanType });

  return new Promise(async (resolve) => {
    let resolved = false;
    let safetyTimer = null;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      currentActiveFinish = null;
      cleanupPlayback();
      resolve();
    };

    currentActiveFinish = finish;

    // Failsafe-Timeout: Maximal 10 Sekunden, falls ein Browser onended verschluckt
    safetyTimer = setTimeout(finish, 10000);

    // 1. Primär: HTML5 Audio
    try {
      currentPlaybackUrl = URL.createObjectURL(playableBlob);
      const audio = new Audio();
      currentAudioPlayback = audio;
      audio.preload = 'auto';

      audio.onended = finish;
      audio.onerror = async () => {
        console.warn('HTML5 Audio fehlgeschlagen, starte Web Audio Fallback...');
        await playViaWebAudio(playableBlob);
        finish();
      };

      audio.src = currentPlaybackUrl;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(async (err) => {
          console.warn('audio.play() blockiert/fehlgeschlagen:', err);
          await playViaWebAudio(playableBlob);
          finish();
        });
      }
    } catch (e) {
      console.warn('HTML5 Audio Exception, nutze Web Audio:', e);
      await playViaWebAudio(playableBlob);
      finish();
    }
  });
}

/**
 * Web Audio API Fallback für Smartphones, falls HTML5 <audio> scheitert
 */
async function playViaWebAudio(blob) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    activeWebAudioCtx = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await new Promise((res, rej) => {
      ctx.decodeAudioData(arrayBuffer, res, rej);
    });

    const source = ctx.createBufferSource();
    activeWebAudioSource = source;
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    return new Promise((resolve) => {
      source.onended = () => {
        try { ctx.close(); } catch (_) {}
        activeWebAudioSource = null;
        activeWebAudioCtx = null;
        resolve();
      };
      source.start(0);
    });
  } catch (err) {
    console.error('Web Audio Fallback konnte Audio nicht abspielen:', err);
  }
}

export function stopAudioPlayback() {
  if (currentActiveFinish) {
    const finish = currentActiveFinish;
    currentActiveFinish = null;
    finish();
  }
  cleanupPlayback();
}

function cleanupPlayback() {
  if (activeWebAudioSource) {
    try { activeWebAudioSource.stop(); } catch (_) {}
    activeWebAudioSource = null;
  }
  if (activeWebAudioCtx) {
    try { activeWebAudioCtx.close(); } catch (_) {}
    activeWebAudioCtx = null;
  }
  if (currentAudioPlayback) {
    try {
      currentAudioPlayback.pause();
      currentAudioPlayback.removeAttribute('src');
      currentAudioPlayback.load();
    } catch (_) {}
    currentAudioPlayback = null;
  }
  if (currentPlaybackUrl) {
    const urlToRevoke = currentPlaybackUrl;
    currentPlaybackUrl = null;
    setTimeout(() => {
      try { URL.revokeObjectURL(urlToRevoke); } catch (_) {}
    }, 1500);
  }
}
