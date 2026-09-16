import { store } from '../store.js';
import { saveStudent } from '../db.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function initLeitnerMode(students) {
  const now = Date.now();

  // Intelligente Alterung (Staleness Decay):
  // Wurde ein Schüler seit mehr als 14 Tagen nicht abgefragt, fällt er zur Auffrischung zurück
  const processedStudents = students.map(student => {
    let box = student.leitnerBox || 1;
    if (student.lastReviewed && (now - student.lastReviewed > FOURTEEN_DAYS_MS)) {
      if (box === 3) box = 2; // Aus 'Sicher' wird 'Wackelig'
      else if (box === 4) box = 1; // Aus 'Weggelegt' wird 'Gar nicht gewusst'
    }
    return { ...student, leitnerBox: box };
  });

  // Session Queue aufbauen: Schüler aus Box 1 & 2 kommen zuerst
  const sortedForSession = [...processedStudents].sort((a, b) => {
    const boxA = a.leitnerBox || 1;
    const boxB = b.leitnerBox || 1;
    return boxA - boxB;
  });

  store.setState({
    students: processedStudents,
    leitnerQueue: sortedForSession,
    currentIndex: 0,
    isFlipped: false,
    leitnerSessionStats: {
      initialCount: sortedForSession.length,
      mastered: 0,
      deferred: 0
    }
  });
}

/**
 * Bewertet die aktuelle Karte und aktualisiert die Session-Queue
 * @param {number} boxNumber - 1 (Gar nicht), 2 (Wackelig), 3 (Sicher), 4 (Weglegen)
 */
export async function rateCurrentCard(boxNumber) {
  const { leitnerQueue, currentIndex, leitnerSessionStats, students } = store.getState();
  if (leitnerQueue.length === 0) return;

  const currentStudent = leitnerQueue[currentIndex];
  if (!currentStudent) return;

  // DB-Update vorbereiten
  const updatedStudent = {
    ...currentStudent,
    leitnerBox: boxNumber,
    lastReviewed: Date.now()
  };

  // Asynchron in IndexedDB persistieren
  saveStudent(updatedStudent).catch(err => console.error('Fehler beim Speichern des Leitner-Status:', err));

  // Auch im globalen students-Array aktualisieren
  const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);

  // Neue Queue berechnen
  let newQueue = [...leitnerQueue];
  let newStats = { ...leitnerSessionStats };

  if (boxNumber === 1) {
    // Box 1: Erscheint nach 2 Karten erneut
    newQueue.splice(currentIndex, 1);
    const insertPos = Math.min(currentIndex + 2, newQueue.length);
    newQueue.splice(insertPos, 0, updatedStudent);
  } else if (boxNumber === 2) {
    // Box 2: Erscheint nach 6 Karten erneut
    newQueue.splice(currentIndex, 1);
    const insertPos = Math.min(currentIndex + 6, newQueue.length);
    newQueue.splice(insertPos, 0, updatedStudent);
  } else if (boxNumber === 3) {
    // Box 3: Sicher gewusst -> Für diese Sitzung gelernt (aus Queue entfernen)
    newQueue.splice(currentIndex, 1);
    newStats.mastered++;
  } else if (boxNumber === 4) {
    // Box 4: Weglegen -> Für diese Sitzung entfernen
    newQueue.splice(currentIndex, 1);
    newStats.deferred++;
  }

  // Index anpassen
  let nextIndex = currentIndex;
  if (nextIndex >= newQueue.length) {
    nextIndex = 0; // Wrap around falls wir am Ende waren
  }

  store.setState({
    students: updatedStudents,
    leitnerQueue: newQueue,
    currentIndex: nextIndex,
    isFlipped: false,
    leitnerSessionStats: newStats
  });
}
