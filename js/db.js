/**
 * IndexedDB Wrapper für lokale Speicherung von Klassen & Schülern
 * Enthält Promisified CRUD-Methoden und automatische Speicherpersistenz
 */

const DB_NAME = 'SchuelerTrainerDB';
const DB_VERSION = 1;

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store: Klassen
      if (!db.objectStoreNames.contains('classes')) {
        const classStore = db.createObjectStore('classes', { keyPath: 'id' });
        classStore.createIndex('name', 'name', { unique: false });
        classStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store: Schüler
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('classId', 'classId', { unique: false });
        studentStore.createIndex('lastName', 'lastName', { unique: false });
        studentStore.createIndex('leitnerBox', 'leitnerBox', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      requestStoragePersistence();
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB Fehler:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Fordert beim Browser dauerhaften Speicher an (verhindert Löschung bei Storage Pressure)
 */
export async function requestStoragePersistence() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('IndexedDB persistent storage:', isPersisted ? 'Aktiviert' : 'Standard');
    } catch (e) {
      console.warn('Persistenz-Anfrage fehlgeschlagen', e);
    }
  }
}

/* ==========================================================================
   Klassen CRUD
   ========================================================================== */

export async function getAllClasses() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('classes', 'readonly');
    const store = tx.objectStore('classes');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClass(classData) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('classes', 'readwrite');
    const store = tx.objectStore('classes');
    const request = store.put(classData);
    request.onsuccess = () => resolve(classData);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteClass(classId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['classes', 'students'], 'readwrite');
    
    // Lösche Klasse
    const classStore = tx.objectStore('classes');
    classStore.delete(classId);

    // Lösche alle Schüler der Klasse
    const studentStore = tx.objectStore('students');
    const index = studentStore.index('classId');
    const request = index.openKeyCursor(IDBKeyRange.only(classId));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        studentStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/* ==========================================================================
   Schüler CRUD
   ========================================================================== */

export async function getStudentsByClass(classId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('students', 'readonly');
    const store = tx.objectStore('students');
    const index = store.index('classId');
    const request = index.getAll(IDBKeyRange.only(classId));
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStudent(studentData) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');
    const request = store.put(studentData);
    request.onsuccess = () => resolve(studentData);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStudent(studentId) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');
    const request = store.delete(studentId);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMultipleStudents(studentsArray) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');

    studentsArray.forEach((student) => {
      store.put(student);
    });

    tx.oncomplete = () => resolve(studentsArray);
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetClassLeitnerProgress(classId) {
  const students = await getStudentsByClass(classId);
  const updated = students.map(s => ({
    ...s,
    leitnerBox: 1,
    lastReviewed: null
  }));
  return saveMultipleStudents(updated);
}
