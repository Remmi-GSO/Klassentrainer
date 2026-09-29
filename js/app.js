/**
 * Haupt-Anwendungslogik (Controller & UI Wiring)
 */

import { store } from './store.js';
import * as db from './db.js';
import { calculateAge, formatDateDisplay } from './parser.js';
import { processImageToSquareWebP } from './image-processor.js';
import { startRecording, stopRecording, playAudioBlob, stopAudioPlayback } from './audio.js';
import { setupCardGestures } from './gestures.js';
import { importClassZip, exportClassZip } from './zip-manager.js';
import { initAlphaMode, alphaNext, alphaPrev } from './modes/alpha-mode.js';
import { initRandomMode, randomNext, randomPrev } from './modes/random-mode.js';
import { initLeitnerMode, rateCurrentCard } from './modes/leitner-mode.js';
import { processExcelImport, exportClassExcel } from './excel-importer.js';
import { ensurePhoneticInMnemonic, getDefaultAudioUrl } from './phonetics.js';

export const APP_VERSION = 'Version 11.6 (v11.6)';

// DOM Referenzen
const DOM = {
  app: document.getElementById('app'),
  classSelect: document.getElementById('classSelect'),
  addClassBtn: document.getElementById('addClassBtn'),
  classMenuBtn: document.getElementById('classMenuBtn'),
  installBtn: document.getElementById('installBtn'),
  
  // Tabs
  modeAlphaTab: document.getElementById('modeAlphaTab'),
  modeRandomTab: document.getElementById('modeRandomTab'),
  modeLeitnerTab: document.getElementById('modeLeitnerTab'),

  // Stage, Card & State Views
  stage: document.getElementById('stage'),
  cardViewport: document.getElementById('cardViewport'),
  flipCard: document.getElementById('flipCard'),
  cardBackFace: document.getElementById('cardBackFace'),
  btnFlipBackToFront: document.getElementById('btnFlipBackToFront'),
  emptyState: document.getElementById('emptyState'),
  emptyStateIcon: document.getElementById('emptyStateIcon'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  emptyAddBtn: document.getElementById('emptyAddBtn'),
  emptyImportExcelBtn: document.getElementById('emptyImportExcelBtn'),
  emptyImportZipBtn: document.getElementById('emptyImportZipBtn'),
  sessionCompleteState: document.getElementById('sessionCompleteState'),
  statMasteredCount: document.getElementById('statMasteredCount'),
  statDeferredCount: document.getElementById('statDeferredCount'),
  restartLeitnerBtn: document.getElementById('restartLeitnerBtn'),
  studentPhoto: document.getElementById('studentPhoto'),
  frontMnemonicBtn: document.getElementById('frontMnemonicBtn'),
  frontAudioBtn: document.getElementById('frontAudioBtn'),
  frontMnemonicOverlay: document.getElementById('frontMnemonicOverlay'),
  frontMnemonicOverlayText: document.getElementById('frontMnemonicOverlayText'),
  frontMnemonicCloseBtn: document.getElementById('frontMnemonicCloseBtn'),
  needsReviewBadge: document.getElementById('needsReviewBadge'),
  frontNameBar: document.getElementById('frontNameBar'),
  frontNameText: document.getElementById('frontNameText'),
  studentLastName: document.getElementById('studentLastName'),
  btnCopyLastName: document.getElementById('btnCopyLastName'),
  studentFirstName: document.getElementById('studentFirstName'),
  studentBirthDate: document.getElementById('studentBirthDate'),
  studentAge: document.getElementById('studentAge'),
  studentCountryBadge: document.getElementById('studentCountryBadge'),
  studentCountryText: document.getElementById('studentCountryText'),
  studentContactInfo: document.getElementById('studentContactInfo'),
  studentAddressRow: document.getElementById('studentAddressRow'),
  studentAddressText: document.getElementById('studentAddressText'),
  btnCopyAddress: document.getElementById('btnCopyAddress'),
  studentPhoneRow: document.getElementById('studentPhoneRow'),
  studentPhoneLink: document.getElementById('studentPhoneLink'),
  btnCopyPhone: document.getElementById('btnCopyPhone'),
  studentEmailRow: document.getElementById('studentEmailRow'),
  studentEmailLink: document.getElementById('studentEmailLink'),
  btnCopyEmail: document.getElementById('btnCopyEmail'),
  
  // Audio & Action Buttons on Card
  playAudioBtn: document.getElementById('playAudioBtn'),
  recordAudioBtn: document.getElementById('recordAudioBtn'),
  importAudioBtn: document.getElementById('importAudioBtn'),
  exportAudioBtn: document.getElementById('exportAudioBtn'),
  deleteAudioBtn: document.getElementById('deleteAudioBtn'),
  audioFileInput: document.getElementById('audioFileInput'),
  audioStatusLabel: document.getElementById('audioStatusLabel'),
  studentMnemonicInput: document.getElementById('studentMnemonicInput'),
  mnemonicSaveStatus: document.getElementById('mnemonicSaveStatus'),
  editStudentBtnHeader: document.getElementById('editStudentBtnHeader'),
  editStudentBtn: document.getElementById('editStudentBtn'),
  deleteStudentBtn: document.getElementById('deleteStudentBtn'),

  // Bottom Docks
  linearDock: document.getElementById('linearDock'),
  leitnerDock: document.getElementById('leitnerDock'),
  prevCardBtn: document.getElementById('prevCardBtn'),
  flipCardBtn: document.getElementById('flipCardBtn'),
  nextCardBtn: document.getElementById('nextCardBtn'),
  cardCounterBadge: document.getElementById('cardCounterBadge'),

  // Leitner Rating Buttons
  btnRateBox1: document.getElementById('btnRateBox1'),
  btnRateBox2: document.getElementById('btnRateBox2'),
  btnRateBox3: document.getElementById('btnRateBox3'),
  btnRateBox4: document.getElementById('btnRateBox4'),
  leitnerProgressBar: document.getElementById('leitnerProgressBar'),
  leitnerCounterBadge: document.getElementById('leitnerCounterBadge'),

  // Modals
  studentModal: document.getElementById('studentModal'),
  studentModalTitle: document.getElementById('studentModalTitle'),
  studentForm: document.getElementById('studentForm'),
  inputStudentLastName: document.getElementById('inputStudentLastName'),
  inputStudentFirstName: document.getElementById('inputStudentFirstName'),
  inputStudentBirthDate: document.getElementById('inputStudentBirthDate'),
  inputStudentCountry: document.getElementById('inputStudentCountry'),
  inputStudentAddress: document.getElementById('inputStudentAddress'),
  inputStudentPhone: document.getElementById('inputStudentPhone'),
  inputStudentEmail: document.getElementById('inputStudentEmail'),
  inputStudentMnemonic: document.getElementById('inputStudentMnemonic'),
  modalPlayAudioBtn: document.getElementById('modalPlayAudioBtn'),
  modalAudioFileInput: document.getElementById('modalAudioFileInput'),
  modalExportAudioBtn: document.getElementById('modalExportAudioBtn'),
  modalDeleteAudioBtn: document.getElementById('modalDeleteAudioBtn'),
  modalAudioStatusLabel: document.getElementById('modalAudioStatusLabel'),
  studentPhotoInput: document.getElementById('studentPhotoInput'),
  studentPhotoPreview: document.getElementById('studentPhotoPreview'),
  btnSaveStudent: document.getElementById('btnSaveStudent'),
  btnCancelStudent: document.getElementById('btnCancelStudent'),
  btnCaptureCamera: document.getElementById('btnCaptureCamera'),

  // Class Management & Review Modals
  classModal: document.getElementById('classModal'),
  btnNewClass: document.getElementById('btnNewClass'),
  btnImportExcel: document.getElementById('btnImportExcel'),
  excelFileInput: document.getElementById('excelFileInput'),
  btnExportExcel: document.getElementById('btnExportExcel'),
  btnExportClass: document.getElementById('btnExportClass'),
  btnResetLeitner: document.getElementById('btnResetLeitner'),
  btnDeleteClass: document.getElementById('btnDeleteClass'),
  btnCloseClassModal: document.getElementById('btnCloseClassModal'),
  zipFileInput: document.getElementById('zipFileInput'),
  btnImportZip: document.getElementById('btnImportZip'),

  // New Class Modal
  newClassModal: document.getElementById('newClassModal'),
  inputNewClassName: document.getElementById('inputNewClassName'),
  btnSaveNewClass: document.getElementById('btnSaveNewClass'),
  btnCancelNewClass: document.getElementById('btnCancelNewClass'),

  reviewModal: document.getElementById('reviewModal'),
  reviewSummaryText: document.getElementById('reviewSummaryText'),
  reviewListContainer: document.getElementById('reviewListContainer'),
  btnSaveReview: document.getElementById('btnSaveReview'),
  btnCancelReview: document.getElementById('btnCancelReview'),

  toastContainer: document.getElementById('toastContainer'),
  appVersionBadge: document.getElementById('appVersionBadge'),
  btnCheckForUpdates: document.getElementById('btnCheckForUpdates'),
  btnForceReload: document.getElementById('btnForceReload'),
  btnOpenFeaturesModal: document.getElementById('btnOpenFeaturesModal'),
  featuresModal: document.getElementById('featuresModal'),
  btnCloseFeaturesModal: document.getElementById('btnCloseFeaturesModal'),
  btnCloseFeaturesFooter: document.getElementById('btnCloseFeaturesFooter')
};

// Lokale State-Hilfsvariablen
let currentImageObjectUrl = null;
let modalPhotoPreviewUrl = null;
let reviewThumbUrls = [];
let isRecordingActive = false;
let isFrontNameRevealed = false;
let isFrontMnemonicOpen = false;
let lastRenderedStudentId = null;
let editingStudentId = null;
let pendingImportStudents = [];
let deferredInstallPrompt = null;
let modalStudentAudioBlob = null;
let modalStudentAudioSource = null;
let mnemonicSaveTimeout = null;

/* ==========================================================================
   Initialisierung
   ========================================================================== */
window.addEventListener('DOMContentLoaded', async () => {
  // Service Worker registrieren & automatische Aktualisierung
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW Register Fehler:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  // Version in den Einstellungen anzeigen
  if (DOM.appVersionBadge) {
    DOM.appVersionBadge.textContent = APP_VERSION;
  }

  // PWA Install Prompt Listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    DOM.installBtn.classList.remove('hidden');
  });

  DOM.installBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        DOM.installBtn.classList.add('hidden');
      }
      deferredInstallPrompt = null;
    }
  });

  // Gesten initialisieren
  setupCardGestures(DOM.cardViewport, {
    onTap: toggleCardFlip,
    onSwipeVertical: toggleCardFlip,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });

  // UI Event Listener verbinden
  setupEventListeners();

  // Store Event Listener
  store.on('stateChange', renderUI);

  // Datenbank & Klassen laden
  await loadClasses();
});

/* ==========================================================================
   Event Listener Setup
   ========================================================================== */
function setupEventListeners() {
  // Klassenauswahl
  DOM.classSelect.addEventListener('change', (e) => selectClass(e.target.value));
  DOM.addClassBtn.addEventListener('click', handleHeaderAddClick);
  DOM.classMenuBtn.addEventListener('click', openClassMenuModal);

  // Modi Umschaltung
  DOM.modeAlphaTab.addEventListener('click', () => switchMode('alpha'));
  DOM.modeRandomTab.addEventListener('click', () => switchMode('random'));
  DOM.modeLeitnerTab.addEventListener('click', () => switchMode('leitner'));

  // Lineare Navigation
  DOM.prevCardBtn.addEventListener('click', handlePrevCard);
  DOM.nextCardBtn.addEventListener('click', handleNextCard);
  DOM.flipCardBtn.addEventListener('click', toggleCardFlip);

  // Leitner Rating Buttons (wichtig: prepareCardTransition vor dem Kartenwechsel aufrufen!)
  DOM.btnRateBox1.addEventListener('click', () => { prepareCardTransition(); rateCurrentCard(1); });
  DOM.btnRateBox2.addEventListener('click', () => { prepareCardTransition(); rateCurrentCard(2); });
  DOM.btnRateBox3.addEventListener('click', () => { prepareCardTransition(); rateCurrentCard(3); });
  DOM.btnRateBox4.addEventListener('click', () => { prepareCardTransition(); rateCurrentCard(4); });

  // Namens-Aufdecken & Eck-Buttons auf Kartenvorderseite (sichere Touch-Isolation für Smartphones)
  if (DOM.frontNameBar) {
    DOM.frontNameBar.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.frontNameBar.addEventListener('click', handleToggleFrontName);
  }
  if (DOM.frontMnemonicBtn) {
    DOM.frontMnemonicBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.frontMnemonicBtn.addEventListener('click', handleToggleFrontMnemonic);
  }
  if (DOM.frontMnemonicCloseBtn) {
    DOM.frontMnemonicCloseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.frontMnemonicCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isFrontMnemonicOpen = false;
      updateFrontMnemonicDisplay();
    });
  }
  if (DOM.frontMnemonicOverlay) {
    DOM.frontMnemonicOverlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.frontMnemonicOverlay.addEventListener('click', (e) => e.stopPropagation());
  }
  if (DOM.frontAudioBtn) {
    DOM.frontAudioBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.frontAudioBtn.addEventListener('click', handlePlayAudio);
  }

  // Schüler Aktionen & Rückseiten-Tools
  if (DOM.btnFlipBackToFront) DOM.btnFlipBackToFront.addEventListener('click', toggleCardFlip);
  if (DOM.editStudentBtnHeader) DOM.editStudentBtnHeader.addEventListener('click', handleEditCurrentStudent);
  if (DOM.editStudentBtn) DOM.editStudentBtn.addEventListener('click', handleEditCurrentStudent);
  if (DOM.deleteStudentBtn) DOM.deleteStudentBtn.addEventListener('click', handleDeleteCurrentStudent);
  if (DOM.btnCopyLastName) DOM.btnCopyLastName.addEventListener('click', handleCopyLastName);
  if (DOM.btnCopyAddress) DOM.btnCopyAddress.addEventListener('click', handleCopyAddress);
  if (DOM.btnCopyPhone) DOM.btnCopyPhone.addEventListener('click', handleCopyPhone);
  if (DOM.btnCopyEmail) DOM.btnCopyEmail.addEventListener('click', handleCopyEmail);

  // Audio Aktionen auf der Karte
  if (DOM.playAudioBtn) DOM.playAudioBtn.addEventListener('click', handlePlayAudio);
  if (DOM.recordAudioBtn) DOM.recordAudioBtn.addEventListener('click', handleToggleAudioRecording);
  if (DOM.importAudioBtn) DOM.importAudioBtn.addEventListener('click', (e) => { e.stopPropagation(); DOM.audioFileInput.click(); });
  if (DOM.audioFileInput) DOM.audioFileInput.addEventListener('change', handleCardAudioFileSelected);
  if (DOM.exportAudioBtn) DOM.exportAudioBtn.addEventListener('click', handleExportAudioFile);
  if (DOM.deleteAudioBtn) DOM.deleteAudioBtn.addEventListener('click', handleDeleteAudio);

  // Eselsbrücke auf der Karte
  if (DOM.studentMnemonicInput) {
    DOM.studentMnemonicInput.addEventListener('pointerdown', (e) => e.stopPropagation());
    DOM.studentMnemonicInput.addEventListener('mousedown', (e) => e.stopPropagation());
    DOM.studentMnemonicInput.addEventListener('touchstart', (e) => e.stopPropagation());
    DOM.studentMnemonicInput.addEventListener('click', (e) => e.stopPropagation());
    DOM.studentMnemonicInput.addEventListener('input', handleMnemonicInput);
    DOM.studentMnemonicInput.addEventListener('blur', handleMnemonicBlur);
  }

  // Schüler Modal
  DOM.studentPhotoPreview.parentElement.addEventListener('click', () => DOM.studentPhotoInput.click());
  DOM.btnCaptureCamera.addEventListener('click', () => {
    DOM.studentPhotoInput.setAttribute('capture', 'user');
    DOM.studentPhotoInput.click();
  });
  DOM.studentPhotoInput.addEventListener('change', handleStudentPhotoSelected);
  if (DOM.modalAudioFileInput) DOM.modalAudioFileInput.addEventListener('change', handleModalAudioFileSelected);
  if (DOM.modalPlayAudioBtn) DOM.modalPlayAudioBtn.addEventListener('click', handleModalPlayAudio);
  if (DOM.modalExportAudioBtn) DOM.modalExportAudioBtn.addEventListener('click', handleModalExportAudio);
  if (DOM.modalDeleteAudioBtn) DOM.modalDeleteAudioBtn.addEventListener('click', handleModalDeleteAudio);
  DOM.btnSaveStudent.addEventListener('click', handleSaveStudentModal);
  DOM.btnCancelStudent.addEventListener('click', closeStudentModal);

  // Klassen Modal & Aktionen
  DOM.btnNewClass.addEventListener('click', () => {
    closeClassMenuModal();
    openNewClassModal();
  });
  if (DOM.btnImportExcel) DOM.btnImportExcel.addEventListener('click', () => {
    closeClassMenuModal();
    DOM.excelFileInput.click();
  });
  if (DOM.excelFileInput) DOM.excelFileInput.addEventListener('change', handleExcelFileSelected);
  if (DOM.btnSaveNewClass) DOM.btnSaveNewClass.addEventListener('click', handleSaveNewClass);
  if (DOM.btnCancelNewClass) DOM.btnCancelNewClass.addEventListener('click', closeNewClassModal);
  if (DOM.inputNewClassName) {
    DOM.inputNewClassName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSaveNewClass();
    });
  }
  DOM.btnImportZip.addEventListener('click', () => DOM.zipFileInput.click());
  DOM.zipFileInput.addEventListener('change', handleZipFileSelected);
  if (DOM.btnExportExcel) DOM.btnExportExcel.addEventListener('click', handleExportCurrentClassExcel);
  DOM.btnExportClass.addEventListener('click', handleExportCurrentClass);
  DOM.btnResetLeitner.addEventListener('click', handleResetLeitnerProgress);
  DOM.btnDeleteClass.addEventListener('click', handleDeleteCurrentClass);
  DOM.btnCloseClassModal.addEventListener('click', closeClassMenuModal);
  if (DOM.btnCheckForUpdates) DOM.btnCheckForUpdates.addEventListener('click', handleCheckForUpdates);
  if (DOM.btnForceReload) DOM.btnForceReload.addEventListener('click', handleForceReload);
  if (DOM.btnOpenFeaturesModal) DOM.btnOpenFeaturesModal.addEventListener('click', openFeaturesModal);
  if (DOM.btnCloseFeaturesModal) DOM.btnCloseFeaturesModal.addEventListener('click', closeFeaturesModal);
  if (DOM.btnCloseFeaturesFooter) DOM.btnCloseFeaturesFooter.addEventListener('click', closeFeaturesModal);

  // Review Modal Aktionen
  if (DOM.btnSaveReview) DOM.btnSaveReview.addEventListener('click', handleConfirmReviewImport);
  if (DOM.btnCancelReview) DOM.btnCancelReview.addEventListener('click', closeReviewModal);

  // Empty & Complete State Buttons
  if (DOM.emptyAddBtn) DOM.emptyAddBtn.addEventListener('click', handleEmptyAddClick);
  if (DOM.emptyImportExcelBtn) DOM.emptyImportExcelBtn.addEventListener('click', () => DOM.excelFileInput.click());
  if (DOM.emptyImportZipBtn) DOM.emptyImportZipBtn.addEventListener('click', () => DOM.zipFileInput.click());
  if (DOM.restartLeitnerBtn) DOM.restartLeitnerBtn.addEventListener('click', handleRestartLeitner);
}

function handleRestartLeitner() {
  prepareCardTransition();
  const { students } = store.getState();
  initLeitnerMode(students);
}

function handleHeaderAddClick() {
  const { currentClass } = store.getState();
  if (!currentClass) {
    openNewClassModal();
  } else {
    openAddStudentModal();
  }
}

function handleEmptyAddClick() {
  const { currentClass } = store.getState();
  if (!currentClass) {
    openNewClassModal();
  } else {
    openAddStudentModal();
  }
}

/* ==========================================================================
   Klassen- & Daten-Management
   ========================================================================== */
async function loadClasses() {
  let classes = await db.getAllClasses();
  DOM.classSelect.innerHTML = '';

  // Automatische Bereinigung des verwaisten Dummys "Meine Klasse 1"
  const dummyIndex = classes.findIndex(c => c.name === 'Meine Klasse 1');
  if (dummyIndex !== -1) {
    const dummyStudents = await db.getStudentsByClass(classes[dummyIndex].id);
    if (dummyStudents.length === 0) {
      await db.deleteClass(classes[dummyIndex].id);
      classes.splice(dummyIndex, 1);
    }
  }

  if (classes.length === 0) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '— Keine Klasse vorhanden —';
    DOM.classSelect.appendChild(emptyOpt);

    const addClassOpt = document.createElement('option');
    addClassOpt.value = '__ADD_NEW_CLASS__';
    addClassOpt.textContent = '➕ Neue Klasse anlegen...';
    DOM.classSelect.appendChild(addClassOpt);

    DOM.classSelect.value = '';
    store.setState({ classes: [], currentClass: null, students: [] });
    renderUI();
    return;
  }

  classes.forEach(cls => {
    const opt = document.createElement('option');
    opt.value = cls.id;
    opt.textContent = cls.name;
    DOM.classSelect.appendChild(opt);
  });

  // Direkte Option zum Anlegen einer neuen Klasse im Dropdown
  const sepOpt = document.createElement('option');
  sepOpt.disabled = true;
  sepOpt.textContent = '──────────';
  DOM.classSelect.appendChild(sepOpt);

  const addClassOpt = document.createElement('option');
  addClassOpt.value = '__ADD_NEW_CLASS__';
  addClassOpt.textContent = '➕ Neue Klasse anlegen...';
  DOM.classSelect.appendChild(addClassOpt);

  // Letzte ausgewählte Klasse und Modus aus localStorage wiederherstellen
  const savedClassId = localStorage.getItem('schueler_trainer_last_class_id');
  const savedMode = localStorage.getItem('schueler_trainer_last_mode') || 'alpha';

  const selectedClass = (savedClassId && classes.find(c => c.id === savedClassId)) || classes[0];
  DOM.classSelect.value = selectedClass.id;
  store.setState({ classes, currentClass: selectedClass, currentMode: savedMode });

  await loadStudentsForClass(selectedClass.id);
}

async function selectClass(classId) {
  if (!classId) return;
  if (classId === '__ADD_NEW_CLASS__') {
    const { currentClass } = store.getState();
    if (currentClass) DOM.classSelect.value = currentClass.id;
    else DOM.classSelect.value = '';
    openNewClassModal();
    return;
  }

  prepareCardTransition();
  const { classes } = store.getState();
  const found = classes.find(c => c.id === classId);
  if (found) {
    localStorage.setItem('schueler_trainer_last_class_id', found.id);
    store.setState({ currentClass: found });
    await loadStudentsForClass(found.id);
  }
}

async function loadStudentsForClass(classId) {
  prepareCardTransition();
  lastRenderedStudentId = null;
  let students = await db.getStudentsByClass(classId);

  // Automatische Bereinigung von Alt-Daten + Lautschrift (Zeile 1) + Neural-TTS Standard-Audio
  const currentYear = new Date().getFullYear();
  const changedStudents = [];

  await Promise.all(students.map(async (s) => {
    let changed = false;
    // 1. Vorname bereinigen
    if (s.firstName && /^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(s.firstName.trim())) {
      s.firstName = '';
      changed = true;
    }
    // 2. Herkunft / Geburtsort bereinigen
    if (s.country && /^(vj\.?|vollj\.?|volljährig|volljaehrig|ja|nein)$/i.test(s.country.trim())) {
      s.country = '';
      changed = true;
    }
    // 3. Volljährigkeitsjahr in Geburtsjahr umrechnen falls in der Zukunft (z. B. 2027 -> 2009)
    if (s.birthDate) {
      const parts = String(s.birthDate).split('-');
      if (parts.length === 3) {
        let yr = parseInt(parts[0], 10);
        if (yr > currentYear) {
          yr -= 18;
          s.birthDate = `${yr}-${parts[1]}-${parts[2]}`;
          changed = true;
        }
      }
    }
    // 4. Lautschrift immer in der 1. Zeile der Eselsbrücke hinterlegen (unter Berücksichtigung von Name & Herkunft)
    const updatedMnemonic = ensurePhoneticInMnemonic(s.mnemonic || '', s.lastName, s.firstName, s.country);
    if (updatedMnemonic && updatedMnemonic !== (s.mnemonic || '')) {
      s.mnemonic = updatedMnemonic;
      changed = true;
    }
    // 5. Audio-Quelle klassifizieren ('default' = Neural-TTS Standardton, 'human' = manuell eingesprochen)
    const defaultAudioUrl = getDefaultAudioUrl(s.lastName, s.firstName);
    if (s.audioBlob && !s.audioSource) {
      const blobType = (s.audioBlob.type || '').toLowerCase();
      if ((blobType.includes('mpeg') || blobType.includes('mp3')) && defaultAudioUrl) {
        s.audioSource = 'default';
        s.defaultAudioUrl = defaultAudioUrl;
      } else {
        s.audioSource = 'human';
      }
      changed = true;
    }

    // 6. Natürliche Neural-TTS Aussprache als Standard hinterlegen, falls noch keine Aufnahme vorhanden ist
    // oder falls sich beim Standardton der Name (z. B. nach Excel-Import) konkretisiert hat
    const shouldLoadDefault = (!s.audioBlob && !s.audioDeletedByUser) ||
      (s.audioSource === 'default' && defaultAudioUrl && s.defaultAudioUrl && s.defaultAudioUrl !== defaultAudioUrl);

    if (shouldLoadDefault && defaultAudioUrl) {
      try {
        const resp = await fetch(defaultAudioUrl);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          if (buf.byteLength > 100) {
            s.audioBlob = new Blob([buf], { type: 'audio/mpeg' });
            s.audioSource = 'default';
            s.defaultAudioUrl = defaultAudioUrl;
            changed = true;
          }
        }
      } catch (_) {
        // Offline oder Audiodatei nicht erreichbar -> stillschweigend überspringen
      }
    }
    if (changed) {
      changedStudents.push(s);
    }
  }));

  if (changedStudents.length > 0) {
    try {
      await db.saveMultipleStudents(changedStudents);
    } catch (err) {
      console.warn('Fehler beim Speichern aktualisierter Schülerdaten:', err);
    }
  }

  store.setState({ students });
  const { currentMode } = store.getState();

  const savedIndexStr = localStorage.getItem(`schueler_trainer_last_index_${classId}_${currentMode}`);
  const savedIndex = savedIndexStr !== null ? parseInt(savedIndexStr, 10) : 0;

  if (currentMode === 'alpha') {
    initAlphaMode(students, savedIndex);
  } else if (currentMode === 'random') {
    initRandomMode(students, savedIndex);
  } else {
    initLeitnerMode(students);
  }
}

function switchMode(newMode) {
  prepareCardTransition();
  const { students, currentClass } = store.getState();
  localStorage.setItem('schueler_trainer_last_mode', newMode);
  store.setState({ currentMode: newMode });

  const classId = currentClass ? currentClass.id : 'default';
  const savedIndexStr = localStorage.getItem(`schueler_trainer_last_index_${classId}_${newMode}`);
  const savedIndex = savedIndexStr !== null ? parseInt(savedIndexStr, 10) : 0;

  if (newMode === 'alpha') {
    initAlphaMode(students, savedIndex);
  } else if (newMode === 'random') {
    initRandomMode(students, savedIndex);
  } else if (newMode === 'leitner') {
    initLeitnerMode(students);
  }
}

/* ==========================================================================
   Navigation & Gesten Handler
   ========================================================================== */
function prepareCardTransition() {
  isFrontNameRevealed = false;
  isFrontMnemonicOpen = false;
  stopAudioPlayback();
  cancelRecordingIfActive();
  store.setState({ isFlipped: false });
  if (DOM.cardBackFace) {
    DOM.cardBackFace.scrollTop = 0;
  }
  if (document.activeElement && DOM.studentMnemonicInput && document.activeElement === DOM.studentMnemonicInput) {
    document.activeElement.blur();
  }
}

async function cancelRecordingIfActive() {
  if (isRecordingActive) {
    try {
      await stopRecording();
    } catch (_) {}
    isRecordingActive = false;
    if (DOM.recordAudioBtn) DOM.recordAudioBtn.classList.remove('is-recording');
    if (DOM.audioStatusLabel) DOM.audioStatusLabel.textContent = 'Aufnahme abgebrochen';
  }
}

function toggleCardFlip() {
  const { isFlipped } = store.getState();
  store.setState({ isFlipped: !isFlipped });
}

function handleToggleFrontName(e) {
  if (e) e.stopPropagation();
  isFrontNameRevealed = !isFrontNameRevealed;
  updateFrontNameDisplay();
}

function updateFrontNameDisplay() {
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !DOM.frontNameBar || !DOM.frontNameText) return;

  if (isFrontNameRevealed) {
    DOM.frontNameBar.classList.add('is-revealed');
    const lastName = currentStudent.lastName || '';
    const firstName = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(currentStudent.firstName || '')) ? '' : (currentStudent.firstName || '');
    DOM.frontNameText.textContent = firstName ? `${lastName}, ${firstName}` : lastName;
  } else {
    DOM.frontNameBar.classList.remove('is-revealed');
    DOM.frontNameText.textContent = '👆 Tippen zum Aufdecken';
  }
}

function handleToggleFrontMnemonic(e) {
  if (e) e.stopPropagation();
  isFrontMnemonicOpen = !isFrontMnemonicOpen;
  updateFrontMnemonicDisplay();
}

function updateFrontMnemonicDisplay() {
  const currentStudent = store.getCurrentStudent();
  if (!DOM.frontMnemonicBtn || !DOM.frontMnemonicOverlay || !DOM.frontMnemonicOverlayText) return;

  if (!currentStudent) {
    DOM.frontMnemonicBtn.classList.add('hidden');
    DOM.frontMnemonicOverlay.classList.add('hidden');
    return;
  }

  const rawMnemonic = (currentStudent.mnemonic || '').trim();
  if (!rawMnemonic) {
    DOM.frontMnemonicBtn.classList.add('hidden');
    DOM.frontMnemonicOverlay.classList.add('hidden');
    return;
  }

  DOM.frontMnemonicBtn.classList.remove('hidden');

  const lines = rawMnemonic.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  const customLines = lines.slice(1).join('\n').trim();
  const hasCustom = customLines.length > 0 || (!firstLine.startsWith('🗣️') && lines.length > 0);

  DOM.frontMnemonicBtn.classList.toggle('has-custom-note', hasCustom);
  DOM.frontMnemonicBtn.classList.toggle('is-active', isFrontMnemonicOpen);

  if (isFrontMnemonicOpen) {
    DOM.frontMnemonicOverlay.classList.remove('hidden');
    DOM.frontMnemonicOverlayText.innerHTML = '';

    if (firstLine.startsWith('🗣️')) {
      const phonDiv = document.createElement('div');
      phonDiv.className = 'front-mnemonic-phonetic-line';
      phonDiv.textContent = firstLine;
      DOM.frontMnemonicOverlayText.appendChild(phonDiv);

      if (customLines) {
        const customDiv = document.createElement('div');
        customDiv.className = 'front-mnemonic-custom-lines';
        customDiv.textContent = customLines;
        DOM.frontMnemonicOverlayText.appendChild(customDiv);
      }
    } else {
      const customDiv = document.createElement('div');
      customDiv.className = 'front-mnemonic-custom-lines';
      customDiv.textContent = rawMnemonic;
      DOM.frontMnemonicOverlayText.appendChild(customDiv);
    }
  } else {
    DOM.frontMnemonicOverlay.classList.add('hidden');
  }
}

function handlePrevCard() {
  prepareCardTransition();
  const { currentMode } = store.getState();
  if (currentMode === 'alpha') alphaPrev();
  else if (currentMode === 'random') randomPrev();
}

function handleNextCard() {
  prepareCardTransition();
  const { currentMode } = store.getState();
  if (currentMode === 'alpha') alphaNext();
  else if (currentMode === 'random') randomNext();
}

function handleSwipeLeft() {
  prepareCardTransition();
  const { currentMode } = store.getState();
  if (currentMode === 'leitner') {
    rateCurrentCard(1); // ❌ Gar nicht gewusst
    showToast('❌ Box 1: In 2 Karten wiederholt');
  } else {
    handleNextCard();
  }
}

function handleSwipeRight() {
  prepareCardTransition();
  const { currentMode } = store.getState();
  if (currentMode === 'leitner') {
    rateCurrentCard(3); // ✅ Sicher gewusst
    showToast('✅ Box 3: Sicher gewusst!');
  } else {
    handlePrevCard();
  }
}

/* ==========================================================================
   UI Rendering
   ========================================================================== */
function renderUI() {
  const state = store.getState();
  const { currentMode, isFlipped, currentIndex, students, leitnerQueue, leitnerSessionStats, currentClass } = state;
  const currentStudent = store.getCurrentStudent();

  // Index persistent merken (pro Klasse & Modus)
  if (currentClass && currentMode && (currentMode === 'alpha' || currentMode === 'random')) {
    localStorage.setItem(`schueler_trainer_last_index_${currentClass.id}_${currentMode}`, currentIndex);
  }

  // Mode Tabs Highlight
  DOM.modeAlphaTab.classList.toggle('is-active', currentMode === 'alpha');
  DOM.modeRandomTab.classList.toggle('is-active', currentMode === 'random');
  DOM.modeLeitnerTab.classList.toggle('is-active', currentMode === 'leitner');

  // Docks Umschalten
  if (currentMode === 'leitner') {
    DOM.linearDock.classList.add('hidden');
    DOM.leitnerDock.classList.remove('hidden');

    const total = leitnerSessionStats.initialCount || 1;
    const remaining = leitnerQueue.length;
    const done = total - remaining;
    const progressPercent = Math.round((done / total) * 100);

    DOM.leitnerProgressBar.style.width = `${progressPercent}%`;
    DOM.leitnerCounterBadge.textContent = `${remaining} verbleibend (${progressPercent}%)`;
  } else {
    DOM.linearDock.classList.remove('hidden');
    DOM.leitnerDock.classList.add('hidden');
    DOM.cardCounterBadge.textContent = students.length > 0 ? `${currentIndex + 1} / ${students.length}` : '0 / 0';
  }

  // Card Flip State
  DOM.flipCard.classList.toggle('is-flipped', isFlipped);

  // Leerer Zustand oder Runden-Abschluss
  if (!currentStudent) {
    lastRenderedStudentId = null;
    renderEmptyOrCompleteState();
    return;
  }

  // Wenn zu einem anderen Schüler gewechselt wurde (z. B. im Intelligenten Modus),
  // aufgedeckten Namen und Eselsbrücken-Overlay garantiert wieder ausblenden!
  if (currentStudent.id !== lastRenderedStudentId) {
    isFrontNameRevealed = false;
    isFrontMnemonicOpen = false;
    lastRenderedStudentId = currentStudent.id;
  }

  // Karte einblenden, States ausblenden
  DOM.cardViewport.classList.remove('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.sessionCompleteState.classList.add('hidden');

  // Bild aktualisieren (Blob-URL sauber freigeben)
  if (currentImageObjectUrl) {
    URL.revokeObjectURL(currentImageObjectUrl);
    currentImageObjectUrl = null;
  }

  if (currentStudent.imageBlob) {
    currentImageObjectUrl = URL.createObjectURL(currentStudent.imageBlob);
    DOM.studentPhoto.src = currentImageObjectUrl;
  } else {
    DOM.studentPhoto.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="%23334155"%3e%3cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3e%3c/svg%3e';
  }

  DOM.needsReviewBadge.classList.toggle('hidden', !currentStudent.needsReview);

  // Vorderseiten-Aufdecktext & Vorderseiten-Leuchte (Eselsbrücke) aktualisieren
  updateFrontNameDisplay();
  updateFrontMnemonicDisplay();

  // Rückseiten-Metadaten
  DOM.studentLastName.textContent = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(currentStudent.lastName || '')) ? 'Unbekannt' : (currentStudent.lastName || 'Unbekannt');
  DOM.studentFirstName.textContent = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(currentStudent.firstName || '')) ? '' : (currentStudent.firstName || '');
  DOM.studentBirthDate.textContent = currentStudent.birthDate ? formatDateDisplay(currentStudent.birthDate) : '_';
  DOM.studentAge.textContent = calculateAge(currentStudent.birthDate);

  // Herkunftsland / Geburtsort (garantieren, dass kein Datum doppelt hineinrutscht und kein VJ-Schulstatus angezeigt wird)
  if (DOM.studentCountryBadge && DOM.studentCountryText) {
    let cleanCountry = (currentStudent.country || '').trim();
    cleanCountry = cleanCountry.replace(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g, '').replace(/^[\s/,\-:;|]+|[\s/,\-:;|]+$/g, '').trim();
    if (/^(vj\.?|vollj\.?|volljährig|volljaehrig|ja|nein)$/i.test(cleanCountry)) {
      cleanCountry = '';
    }
    if (cleanCountry) {
      DOM.studentCountryBadge.classList.remove('hidden');
      DOM.studentCountryText.textContent = cleanCountry;
    } else {
      DOM.studentCountryBadge.classList.add('hidden');
      DOM.studentCountryText.textContent = '';
    }
  }

  // Anschrift / Adresse
  if (DOM.studentAddressRow && DOM.studentAddressText) {
    if (currentStudent.address) {
      DOM.studentAddressRow.classList.remove('hidden');
      DOM.studentAddressText.textContent = currentStudent.address;
    } else {
      DOM.studentAddressRow.classList.add('hidden');
      DOM.studentAddressText.textContent = '';
    }
  }

  // Telefonnummer
  if (DOM.studentPhoneRow && DOM.studentPhoneLink) {
    if (currentStudent.phone) {
      DOM.studentPhoneRow.classList.remove('hidden');
      DOM.studentPhoneLink.textContent = currentStudent.phone;
      DOM.studentPhoneLink.href = `tel:${currentStudent.phone.replace(/[^0-9+]/g, '')}`;
    } else {
      DOM.studentPhoneRow.classList.add('hidden');
      DOM.studentPhoneLink.textContent = '';
      DOM.studentPhoneLink.removeAttribute('href');
    }
  }

  // E-Mail-Adresse
  if (DOM.studentEmailRow && DOM.studentEmailLink) {
    if (currentStudent.email && currentStudent.email.trim()) {
      DOM.studentEmailRow.classList.remove('hidden');
      DOM.studentEmailLink.textContent = currentStudent.email.trim();
      DOM.studentEmailLink.href = `mailto:${currentStudent.email.trim()}`;
    } else {
      DOM.studentEmailRow.classList.add('hidden');
      DOM.studentEmailLink.textContent = '';
      DOM.studentEmailLink.removeAttribute('href');
    }
  }

  // Eselsbrücke
  if (DOM.studentMnemonicInput) {
    DOM.studentMnemonicInput.dataset.studentId = currentStudent.id;
    DOM.studentMnemonicInput.value = currentStudent.mnemonic || '';
  }
  if (DOM.mnemonicSaveStatus) {
    DOM.mnemonicSaveStatus.classList.remove('is-visible');
  }

  // Audio-Status & Buttons (Vorderseite: 🔊 Standardton vs. 🗣️ Mensch eingesprochen & Rückseite ▶️)
  if (currentStudent.audioBlob) {
    const isHumanAudio = currentStudent.audioSource === 'human';
    if (DOM.frontAudioBtn) {
      DOM.frontAudioBtn.classList.remove('hidden');
      DOM.frontAudioBtn.textContent = isHumanAudio ? '🗣️' : '🔊';
      DOM.frontAudioBtn.classList.toggle('is-human-audio', isHumanAudio);
      DOM.frontAudioBtn.classList.toggle('is-default-audio', !isHumanAudio);
      const btnTitle = isHumanAudio
        ? 'Eigene Sprachaufnahme abspielen (Mensch)'
        : 'Standardton für den Namen abspielen';
      DOM.frontAudioBtn.title = btnTitle;
      DOM.frontAudioBtn.setAttribute('aria-label', btnTitle);
    }
    DOM.playAudioBtn.disabled = false;
    DOM.playAudioBtn.style.opacity = '1';
    if (DOM.exportAudioBtn) DOM.exportAudioBtn.disabled = false;
    if (DOM.deleteAudioBtn) DOM.deleteAudioBtn.classList.remove('hidden');
    DOM.audioStatusLabel.textContent = isHumanAudio
      ? '🗣️ Eigene Aufnahme (Mensch)'
      : '🔊 Standardton hinterlegt';
    DOM.audioStatusLabel.className = isHumanAudio
      ? 'audio-status-badge is-available is-human'
      : 'audio-status-badge is-available';
  } else {
    if (DOM.frontAudioBtn) {
      DOM.frontAudioBtn.classList.add('hidden');
      DOM.frontAudioBtn.classList.remove('is-human-audio', 'is-default-audio');
    }
    DOM.playAudioBtn.disabled = true;
    DOM.playAudioBtn.style.opacity = '0.35';
    if (DOM.exportAudioBtn) DOM.exportAudioBtn.disabled = true;
    if (DOM.deleteAudioBtn) DOM.deleteAudioBtn.classList.add('hidden');
    DOM.audioStatusLabel.textContent = 'Keine Aussprache (🎙️ tippen)';
    DOM.audioStatusLabel.className = 'audio-status-badge is-empty';
  }
}

function renderEmptyOrCompleteState() {
  const { currentMode, students, leitnerSessionStats, currentClass, classes } = store.getState();

  DOM.cardViewport.classList.add('hidden');

  if (!currentClass || classes.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    DOM.sessionCompleteState.classList.add('hidden');
    if (DOM.emptyStateIcon) DOM.emptyStateIcon.textContent = '🎒';
    if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = 'Noch keine Klasse angelegt';
    if (DOM.emptyStateDesc) DOM.emptyStateDesc.textContent = 'Erstelle deine erste Klasse oder importiere eine Excel-Liste / ein Backup.';
    if (DOM.emptyAddBtn) DOM.emptyAddBtn.textContent = '➕ Klasse anlegen';
  } else if (students.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    DOM.sessionCompleteState.classList.add('hidden');
    if (DOM.emptyStateIcon) DOM.emptyStateIcon.textContent = '👥';
    if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = `Keine Schüler in "${currentClass.name}"`;
    if (DOM.emptyStateDesc) DOM.emptyStateDesc.textContent = 'Füge Schüler hinzu, importiere eine Excel-Tabelle oder ein ZIP-Backup mit Fotos.';
    if (DOM.emptyAddBtn) DOM.emptyAddBtn.textContent = '➕ Schüler anlegen';
  } else if (currentMode === 'leitner') {
    DOM.emptyState.classList.add('hidden');
    DOM.sessionCompleteState.classList.remove('hidden');
    if (DOM.statMasteredCount) DOM.statMasteredCount.textContent = leitnerSessionStats.mastered || 0;
    if (DOM.statDeferredCount) DOM.statDeferredCount.textContent = leitnerSessionStats.deferred || 0;
  }
}

/* ==========================================================================
   Eselsbrücke (Mnemonic) Auto-Save & Handling
   ========================================================================== */
function updateStudentMnemonic(studentId, mnemonicText) {
  const { students, leitnerQueue } = store.getState();
  const s1 = students.find(s => s.id === studentId);
  if (s1) s1.mnemonic = mnemonicText;
  const s2 = leitnerQueue.find(s => s.id === studentId);
  if (s2) s2.mnemonic = mnemonicText;
  return s1 || s2 || store.getCurrentStudent();
}

function handleMnemonicInput(e) {
  const studentId = e.target.dataset.studentId;
  const student = updateStudentMnemonic(studentId, e.target.value);
  if (!student) return;

  updateFrontMnemonicDisplay();
  showMnemonicSaving();

  clearTimeout(mnemonicSaveTimeout);
  mnemonicSaveTimeout = setTimeout(async () => {
    try {
      await db.saveStudent(student);
      showMnemonicSaved();
    } catch (err) {
      console.error('Fehler beim Speichern der Eselsbrücke:', err);
    }
  }, 400);
}

async function handleMnemonicBlur(e) {
  clearTimeout(mnemonicSaveTimeout);
  const studentId = e.target.dataset.studentId;
  const student = updateStudentMnemonic(studentId, e.target.value);
  if (!student) return;

  updateFrontMnemonicDisplay();

  try {
    await db.saveStudent(student);
    showMnemonicSaved();
  } catch (err) {
    console.error('Fehler beim Speichern der Eselsbrücke:', err);
  }
}

function showMnemonicSaving() {
  if (!DOM.mnemonicSaveStatus) return;
  DOM.mnemonicSaveStatus.textContent = 'Speichert...';
  DOM.mnemonicSaveStatus.classList.add('is-visible');
}

function showMnemonicSaved() {
  if (!DOM.mnemonicSaveStatus) return;
  DOM.mnemonicSaveStatus.textContent = '✓ Gespeichert';
  DOM.mnemonicSaveStatus.classList.add('is-visible');
  setTimeout(() => {
    if (DOM.mnemonicSaveStatus && DOM.mnemonicSaveStatus.textContent === '✓ Gespeichert') {
      DOM.mnemonicSaveStatus.classList.remove('is-visible');
    }
  }, 1600);
}

/* ==========================================================================
   Audio Aufnahme, Wiedergabe, Import & Export
   ========================================================================== */
async function handlePlayAudio(e) {
  if (e) e.stopPropagation();
  if (DOM.playAudioBtn.classList.contains('is-playing')) {
    stopAudioPlayback();
    return;
  }
  const currentStudent = store.getCurrentStudent();
  if (currentStudent && currentStudent.audioBlob) {
    const isHumanAudio = currentStudent.audioSource === 'human';
    DOM.playAudioBtn.style.transform = 'scale(1.2)';
    DOM.playAudioBtn.classList.add('is-playing');
    if (DOM.frontAudioBtn) DOM.frontAudioBtn.classList.add('is-playing');
    DOM.audioStatusLabel.textContent = isHumanAudio ? '🗣️ Spielt eigene Aufnahme...' : '🔊 Spielt Standardton...';
    DOM.audioStatusLabel.className = 'audio-status-badge is-playing';

    try {
      await playAudioBlob(currentStudent.audioBlob);
    } catch (err) {
      console.error('Audio-Wiedergabefehler:', err);
      showToast('⚠️ Wiedergabe nicht möglich');
    } finally {
      DOM.playAudioBtn.style.transform = 'scale(1)';
      DOM.playAudioBtn.classList.remove('is-playing');
      if (DOM.frontAudioBtn) DOM.frontAudioBtn.classList.remove('is-playing');
      DOM.audioStatusLabel.textContent = isHumanAudio
        ? '🗣️ Eigene Aufnahme (Mensch)'
        : '🔊 Standardton hinterlegt';
      DOM.audioStatusLabel.className = isHumanAudio
        ? 'audio-status-badge is-available is-human'
        : 'audio-status-badge is-available';
    }
  }
}

async function handleToggleAudioRecording(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent) return;

  if (!isRecordingActive) {
    // Aufnahme starten: Sofortiges Feedback für Hardware-Initialisierung
    DOM.recordAudioBtn.classList.add('is-recording');
    DOM.audioStatusLabel.textContent = '⏳ Mikrofon startet...';
    DOM.audioStatusLabel.className = 'audio-status-badge is-starting';
    try {
      await startRecording();
      isRecordingActive = true;
      DOM.audioStatusLabel.textContent = '🔴 Nimmt auf... (Tippe zum Stoppen)';
      DOM.audioStatusLabel.className = 'audio-status-badge is-recording';
    } catch (err) {
      DOM.recordAudioBtn.classList.remove('is-recording');
      DOM.audioStatusLabel.textContent = 'Keine Aussprache (🎙️ tippen)';
      DOM.audioStatusLabel.className = 'audio-status-badge is-empty';
      showToast('⚠️ Mikrofonzugriff verweigert oder nicht verfügbar');
    }
  } else {
    // Aufnahme stoppen & speichern -> als menschliche Aufnahme ('human') markieren (🗣️)
    try {
      const audioBlob = await stopRecording();
      isRecordingActive = false;
      DOM.recordAudioBtn.classList.remove('is-recording');

      currentStudent.audioBlob = audioBlob;
      currentStudent.audioSource = 'human';
      currentStudent.audioDeletedByUser = false;
      await db.saveStudent(currentStudent);
      store.emit('stateChange', store.getState());
      showToast('🗣️ Eigene Sprachaufnahme gespeichert');
    } catch (err) {
      console.error('Fehler beim Stoppen der Aufnahme:', err);
      isRecordingActive = false;
      DOM.recordAudioBtn.classList.remove('is-recording');
      DOM.audioStatusLabel.textContent = 'Fehler bei Aufnahme';
      DOM.audioStatusLabel.className = 'audio-status-badge is-empty';
    }
  }
}

async function handleCardAudioFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const currentStudent = store.getCurrentStudent();
  if (!currentStudent) return;

  try {
    currentStudent.audioBlob = file;
    currentStudent.audioSource = 'human';
    currentStudent.audioDeletedByUser = false;
    await db.saveStudent(currentStudent);
    store.emit('stateChange', store.getState());
    showToast('🗣️ Eigene Audiodatei importiert');
  } catch (err) {
    console.error('Fehler beim Importieren der Audiodatei:', err);
    showToast('⚠️ Fehler beim Audio-Import');
  } finally {
    DOM.audioFileInput.value = '';
  }
}

function handleExportAudioFile(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !currentStudent.audioBlob) {
    showToast('⚠️ Keine Audiodatei vorhanden');
    return;
  }

  const ext = getAudioFileExtension(currentStudent.audioBlob.type);
  const safeLastName = (currentStudent.lastName || 'Schueler').replace(/[\\/:*?"<>|]/g, '');
  const safeFirstName = (currentStudent.firstName || '').replace(/[\\/:*?"<>|]/g, '');
  const filename = `${safeLastName}_${safeFirstName}_Aussprache.${ext}`.replace('__', '_');

  downloadBlob(currentStudent.audioBlob, filename);
  showToast(`💾 "${filename}" heruntergeladen`);
}

async function handleDeleteAudio(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !currentStudent.audioBlob) return;

  const isHumanAudio = currentStudent.audioSource === 'human';
  const defaultAudioUrl = getDefaultAudioUrl(currentStudent.lastName, currentStudent.firstName);

  if (isHumanAudio && defaultAudioUrl) {
    if (confirm(`Eigene Sprachaufnahme für "${currentStudent.firstName} ${currentStudent.lastName}" löschen und wieder auf den Standardton (🔊) zurücksetzen?`)) {
      try {
        const resp = await fetch(defaultAudioUrl);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          if (buf.byteLength > 100) {
            currentStudent.audioBlob = new Blob([buf], { type: 'audio/mpeg' });
            currentStudent.audioSource = 'default';
            currentStudent.defaultAudioUrl = defaultAudioUrl;
            currentStudent.audioDeletedByUser = false;
            await db.saveStudent(currentStudent);
            store.emit('stateChange', store.getState());
            showToast('🔊 Eigene Aufnahme gelöscht – Standardton wiederhergestellt');
            return;
          }
        }
      } catch (_) {}
      currentStudent.audioBlob = null;
      currentStudent.audioSource = null;
      currentStudent.audioDeletedByUser = true;
      await db.saveStudent(currentStudent);
      store.emit('stateChange', store.getState());
      showToast('🗑️ Eigene Aufnahme gelöscht');
    }
    return;
  }

  if (confirm(`Aussprache für "${currentStudent.firstName} ${currentStudent.lastName}" wirklich löschen?`)) {
    currentStudent.audioBlob = null;
    currentStudent.audioSource = null;
    currentStudent.audioDeletedByUser = true;
    await db.saveStudent(currentStudent);
    store.emit('stateChange', store.getState());
    showToast('🗑️ Aussprache gelöscht');
  }
}

/* ==========================================================================
   Modal Audio Helfer
   ========================================================================== */
function updateModalAudioUI() {
  if (!DOM.modalAudioStatusLabel) return;
  if (modalStudentAudioBlob) {
    const isHumanAudio = modalStudentAudioSource === 'human';
    if (DOM.modalPlayAudioBtn) DOM.modalPlayAudioBtn.disabled = false;
    if (DOM.modalExportAudioBtn) DOM.modalExportAudioBtn.disabled = false;
    if (DOM.modalDeleteAudioBtn) DOM.modalDeleteAudioBtn.style.display = 'inline-flex';
    DOM.modalAudioStatusLabel.className = isHumanAudio
      ? 'audio-status-badge is-available is-human'
      : 'audio-status-badge is-available';
    DOM.modalAudioStatusLabel.textContent = isHumanAudio
      ? '🗣️ Eigene Aufnahme (Mensch)'
      : '🔊 Standardton hinterlegt';
  } else {
    if (DOM.modalPlayAudioBtn) DOM.modalPlayAudioBtn.disabled = true;
    if (DOM.modalExportAudioBtn) DOM.modalExportAudioBtn.disabled = true;
    if (DOM.modalDeleteAudioBtn) DOM.modalDeleteAudioBtn.style.display = 'none';
    DOM.modalAudioStatusLabel.className = 'audio-status-badge is-empty';
    DOM.modalAudioStatusLabel.textContent = 'Keine Aussprache';
  }
}

function handleModalAudioFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  modalStudentAudioBlob = file;
  modalStudentAudioSource = 'human';
  updateModalAudioUI();
  DOM.modalAudioFileInput.value = '';
  showToast('🗣️ Eigene Audiodatei ausgewählt');
}

async function handleModalPlayAudio() {
  if (!modalStudentAudioBlob) return;
  if (DOM.modalPlayAudioBtn && DOM.modalPlayAudioBtn.classList.contains('is-playing')) {
    stopAudioPlayback();
    return;
  }

  if (DOM.modalPlayAudioBtn) {
    DOM.modalPlayAudioBtn.classList.add('is-playing');
    DOM.modalPlayAudioBtn.textContent = '⏹️ Stopp';
  }
  if (DOM.modalAudioStatusLabel) {
    DOM.modalAudioStatusLabel.className = 'audio-status-badge is-playing';
    DOM.modalAudioStatusLabel.textContent = modalStudentAudioSource === 'human'
      ? '🗣️ Spielt eigene Aufnahme...'
      : '🔊 Spielt Standardton...';
  }

  try {
    await playAudioBlob(modalStudentAudioBlob);
  } catch (err) {
    console.error('Modal Audio-Wiedergabefehler:', err);
    showToast('⚠️ Wiedergabe nicht möglich');
  } finally {
    if (DOM.modalPlayAudioBtn) {
      DOM.modalPlayAudioBtn.classList.remove('is-playing');
      DOM.modalPlayAudioBtn.textContent = '▶️ Anhören';
    }
    updateModalAudioUI();
  }
}

function handleModalExportAudio() {
  if (!modalStudentAudioBlob) return;
  const lastName = DOM.inputStudentLastName.value.trim() || 'Schueler';
  const firstName = DOM.inputStudentFirstName.value.trim() || '';
  const ext = getAudioFileExtension(modalStudentAudioBlob.type);
  downloadBlob(modalStudentAudioBlob, `${lastName}_${firstName}_Aussprache.${ext}`);
}

function handleModalDeleteAudio() {
  modalStudentAudioBlob = null;
  modalStudentAudioSource = null;
  updateModalAudioUI();
  showToast('🗑️ Audio im Entwurf entfernt');
}

/* ==========================================================================
   Allgemeine Audio- & Datei-Helfer
   ========================================================================== */
function getAudioFileExtension(mimeType) {
  if (!mimeType) return 'webm';
  const lower = mimeType.toLowerCase();
  if (lower.includes('mp3') || lower.includes('mpeg')) return 'mp3';
  if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a';
  if (lower.includes('wav')) return 'wav';
  if (lower.includes('ogg')) return 'ogg';
  return 'webm';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ==========================================================================
   Schüler Hinzufügen / Bearbeiten / Löschen
   ========================================================================== */
let selectedStudentBlob = null;

function openAddStudentModal() {
  editingStudentId = null;
  selectedStudentBlob = null;
  modalStudentAudioBlob = null;
  modalStudentAudioSource = null;
  DOM.studentModalTitle.textContent = 'Neuen Schüler anlegen';
  DOM.inputStudentLastName.value = '';
  DOM.inputStudentFirstName.value = '';
  DOM.inputStudentBirthDate.value = '';
  if (DOM.inputStudentCountry) DOM.inputStudentCountry.value = '';
  if (DOM.inputStudentAddress) DOM.inputStudentAddress.value = '';
  if (DOM.inputStudentPhone) DOM.inputStudentPhone.value = '';
  if (DOM.inputStudentEmail) DOM.inputStudentEmail.value = '';
  if (DOM.inputStudentMnemonic) DOM.inputStudentMnemonic.value = '';
  updateModalAudioUI();
  DOM.studentPhotoPreview.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="%23475569"%3e%3cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3e%3c/svg%3e';
  DOM.studentModal.classList.add('is-active');
}

function handleEditCurrentStudent(e) {
  e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent) return;

  editingStudentId = currentStudent.id;
  selectedStudentBlob = currentStudent.imageBlob;
  modalStudentAudioBlob = currentStudent.audioBlob || null;
  modalStudentAudioSource = currentStudent.audioSource || (currentStudent.audioBlob ? 'default' : null);
  DOM.studentModalTitle.textContent = 'Schülerdaten bearbeiten';
  DOM.inputStudentLastName.value = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(currentStudent.lastName || '')) ? '' : (currentStudent.lastName || '');
  DOM.inputStudentFirstName.value = (/^(vj\.?|vollj\.?|volljährig|volljaehrig)$/i.test(currentStudent.firstName || '')) ? '' : (currentStudent.firstName || '');
  DOM.inputStudentBirthDate.value = currentStudent.birthDate || '';
  if (DOM.inputStudentCountry) {
    let c = (currentStudent.country || '').trim();
    DOM.inputStudentCountry.value = (/^(vj\.?|vollj\.?|volljährig|volljaehrig|ja|nein)$/i.test(c)) ? '' : c;
  }
  if (DOM.inputStudentAddress) DOM.inputStudentAddress.value = currentStudent.address || '';
  if (DOM.inputStudentPhone) DOM.inputStudentPhone.value = currentStudent.phone || '';
  if (DOM.inputStudentEmail) DOM.inputStudentEmail.value = currentStudent.email || '';
  if (DOM.inputStudentMnemonic) DOM.inputStudentMnemonic.value = currentStudent.mnemonic || '';
  updateModalAudioUI();

  if (currentStudent.imageBlob) {
    if (modalPhotoPreviewUrl) URL.revokeObjectURL(modalPhotoPreviewUrl);
    modalPhotoPreviewUrl = URL.createObjectURL(currentStudent.imageBlob);
    DOM.studentPhotoPreview.src = modalPhotoPreviewUrl;
  }

  DOM.studentModal.classList.add('is-active');
}

async function handleDeleteCurrentStudent(e) {
  e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent) return;

  if (confirm(`Möchtest du "${currentStudent.firstName} ${currentStudent.lastName}" wirklich löschen?`)) {
    await db.deleteStudent(currentStudent.id);
    const { currentClass } = store.getState();
    await loadStudentsForClass(currentClass.id);
    showToast('🗑️ Schüler gelöscht');
  }
}

async function handleStudentPhotoSelected(e) {
  const file = e.target.files[0];
  if (file) {
    try {
      selectedStudentBlob = await processImageToSquareWebP(file);
      if (modalPhotoPreviewUrl) URL.revokeObjectURL(modalPhotoPreviewUrl);
      modalPhotoPreviewUrl = URL.createObjectURL(selectedStudentBlob);
      DOM.studentPhotoPreview.src = modalPhotoPreviewUrl;
    } catch (err) {
      showToast('⚠️ Fehler beim Verarbeiten des Bildes');
    }
  }
}

async function handleSaveStudentModal() {
  const lastName = DOM.inputStudentLastName.value.trim();
  const firstName = DOM.inputStudentFirstName.value.trim();
  const birthDate = DOM.inputStudentBirthDate.value || null;
  const country = DOM.inputStudentCountry ? DOM.inputStudentCountry.value.trim() : '';
  const address = DOM.inputStudentAddress ? DOM.inputStudentAddress.value.trim() : '';
  const phone = DOM.inputStudentPhone ? DOM.inputStudentPhone.value.trim() : '';
  const email = DOM.inputStudentEmail ? DOM.inputStudentEmail.value.trim() : '';
  const rawMnemonic = DOM.inputStudentMnemonic ? DOM.inputStudentMnemonic.value.trim() : '';
  const mnemonic = ensurePhoneticInMnemonic(rawMnemonic, lastName, firstName, country, true);
  const { currentClass } = store.getState();

  if (!lastName) {
    alert('Bitte mindestens einen Nachnamen eingeben.');
    return;
  }

  const studentData = {
    id: editingStudentId || ('std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)),
    classId: currentClass.id,
    lastName,
    firstName,
    birthDate,
    country,
    address,
    phone,
    email,
    mnemonic,
    imageBlob: selectedStudentBlob,
    audioBlob: modalStudentAudioBlob,
    audioSource: modalStudentAudioBlob ? (modalStudentAudioSource || 'default') : null,
    needsReview: false,
    leitnerBox: 1,
    lastReviewed: null
  };

  // Falls Bearbeitung: Bestehende Leitner-Box beibehalten
  if (editingStudentId) {
    const existing = store.getCurrentStudent();
    if (existing) {
      studentData.leitnerBox = existing.leitnerBox;
      studentData.lastReviewed = existing.lastReviewed;
    }
  }

  await db.saveStudent(studentData);
  closeStudentModal();
  await loadStudentsForClass(currentClass.id);
  showToast('💾 Schüler gespeichert');
}

function closeStudentModal() {
  DOM.studentModal.classList.remove('is-active');
  DOM.studentPhotoInput.value = '';
  modalStudentAudioBlob = null;
  modalStudentAudioSource = null;
  if (modalPhotoPreviewUrl) {
    URL.revokeObjectURL(modalPhotoPreviewUrl);
    modalPhotoPreviewUrl = null;
  }
}

/* ==========================================================================
   ZIP Import & Review Dialog
   ========================================================================== */
async function handleZipFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const { currentClass } = store.getState();
  showToast('⏳ Entpacke & konvertiere Bilder...');

  try {
    const { students, summary } = await importClassZip(file, currentClass.id);
    pendingImportStudents = students;

    DOM.classModal.classList.remove('is-active');
    openReviewModal(summary, students);
  } catch (err) {
    alert(`Fehler beim ZIP-Import: ${err.message}`);
  } finally {
    DOM.zipFileInput.value = '';
  }
}

function openReviewModal(summary, students) {
  DOM.reviewSummaryText.innerHTML = `
    <strong>${summary.total}</strong> Schüler gefunden: 
    <span style="color:var(--color-success)">${summary.complete} vollständig</span>, 
    <span style="color:var(--color-warning)">${summary.needsReview} unvollständig / Dateinamen unklar</span>.
  `;

  // Vorherige Thumbnails freigeben
  reviewThumbUrls.forEach(url => URL.revokeObjectURL(url));
  reviewThumbUrls = [];

  DOM.reviewListContainer.innerHTML = '';
  students.forEach((student, index) => {
    const item = document.createElement('div');
    item.className = 'review-item';

    const thumbUrl = URL.createObjectURL(student.imageBlob);
    reviewThumbUrls.push(thumbUrl);

    item.innerHTML = `
      <img src="${thumbUrl}" class="review-thumb" alt="Foto">
      <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; gap:6px;">
          <input type="text" class="form-input" style="flex:1;" placeholder="Nachname" value="${student.lastName}" data-idx="${index}" data-field="lastName">
          <input type="text" class="form-input" style="flex:1;" placeholder="Vorname" value="${student.firstName}" data-idx="${index}" data-field="firstName">
        </div>
        <div style="display:flex; gap:6px;">
          <input type="date" class="form-input" style="flex:1;" placeholder="Geburtsdatum" value="${student.birthDate || ''}" data-idx="${index}" data-field="birthDate">
          <input type="text" class="form-input" style="flex:1;" placeholder="💡 Eselsbrücke (optional)" value="${student.mnemonic || ''}" data-idx="${index}" data-field="mnemonic">
        </div>
        ${student.audioBlob ? '<span style="font-size:0.75rem; color:var(--accent-primary); font-weight:600;">🎙️ Aussprache-Audio im Archiv enthalten</span>' : ''}
      </div>
    `;
    DOM.reviewListContainer.appendChild(item);
  });

  DOM.reviewModal.classList.add('is-active');
}

function closeReviewModal() {
  DOM.reviewModal.classList.remove('is-active');
  reviewThumbUrls.forEach(url => URL.revokeObjectURL(url));
  reviewThumbUrls = [];
  pendingImportStudents = [];
}

async function handleConfirmReviewImport() {
  // Geänderte Felder aus Review Dialog übernehmen
  const inputs = DOM.reviewListContainer.querySelectorAll('input');
  inputs.forEach(input => {
    const idx = parseInt(input.dataset.idx, 10);
    const field = input.dataset.field;
    if (pendingImportStudents[idx]) {
      const val = input.value.trim();
      if (field === 'mnemonic') {
        pendingImportStudents[idx].mnemonic = val;
      } else {
        pendingImportStudents[idx][field] = val || null;
      }
      if (pendingImportStudents[idx].lastName) {
        pendingImportStudents[idx].needsReview = false;
      }
    }
  });

  // Lautschrift in Zeile 1 für alle importierten Schüler sicherstellen
  pendingImportStudents.forEach(s => {
    s.mnemonic = ensurePhoneticInMnemonic(s.mnemonic || '', s.lastName, s.firstName, s.country || '');
  });

  await db.saveMultipleStudents(pendingImportStudents);
  closeReviewModal();
  const { currentClass } = store.getState();
  await loadStudentsForClass(currentClass.id);
  showToast(`🎉 ${pendingImportStudents.length} Schüler importiert!`);
}

/* ==========================================================================
   Klassenmenü Aktionen
   ========================================================================== */
function openClassMenuModal() {
  DOM.classModal.classList.add('is-active');
}

function closeClassMenuModal() {
  DOM.classModal.classList.remove('is-active');
}

function openNewClassModal() {
  if (DOM.inputNewClassName) DOM.inputNewClassName.value = '';
  if (DOM.newClassModal) {
    DOM.newClassModal.classList.add('is-active');
    setTimeout(() => {
      if (DOM.inputNewClassName) DOM.inputNewClassName.focus();
    }, 120);
  }
}

function closeNewClassModal() {
  if (DOM.newClassModal) DOM.newClassModal.classList.remove('is-active');
  if (DOM.inputNewClassName) DOM.inputNewClassName.value = '';
}

async function handleSaveNewClass() {
  const name = DOM.inputNewClassName ? DOM.inputNewClassName.value.trim() : '';
  if (!name) {
    alert('Bitte einen Namen für die Klasse oder Gruppe eingeben.');
    return;
  }

  const newClass = {
    id: 'cls_' + Date.now(),
    name: name,
    createdAt: Date.now()
  };

  await db.saveClass(newClass);
  localStorage.setItem('schueler_trainer_last_class_id', newClass.id);
  closeNewClassModal();
  closeClassMenuModal();
  await loadClasses();
  await selectClass(newClass.id);
  showToast(`🏫 Klasse "${newClass.name}" erstellt`);
}

async function handleExportCurrentClass() {
  const { currentClass } = store.getState();
  showToast('📦 Erstelle ZIP-Backup...');
  try {
    await exportClassZip(currentClass.id, currentClass.name);
    showToast('✅ Export erfolgreich heruntergeladen');
  } catch (err) {
    alert(`Export fehlgeschlagen: ${err.message}`);
  }
}

async function handleExportCurrentClassExcel() {
  const { currentClass } = store.getState();
  if (!currentClass) {
    showToast('⚠️ Keine Klasse ausgewählt');
    return;
  }
  showToast('📊 Erstelle Excel-Export...');
  try {
    await exportClassExcel(currentClass.id, currentClass.name);
    showToast('✅ Excel-Tabelle erfolgreich heruntergeladen');
  } catch (err) {
    console.error('Fehler beim Excel-Export:', err);
    alert(`Excel-Export fehlgeschlagen: ${err.message}`);
  }
}

async function handleResetLeitnerProgress() {
  const { currentClass } = store.getState();
  if (confirm(`Lernfortschritt für "${currentClass.name}" wirklich auf 0 zurücksetzen?`)) {
    await db.resetClassLeitnerProgress(currentClass.id);
    await loadStudentsForClass(currentClass.id);
    closeClassMenuModal();
    showToast('🔄 Lernstand erfolgreich zurückgesetzt');
  }
}

async function handleDeleteCurrentClass() {
  const { currentClass } = store.getState();
  if (!currentClass) return;

  if (confirm(`Klasse "${currentClass.name}" und ALLE zugehörigen Schülerdaten unwiderruflich löschen?`)) {
    await db.deleteClass(currentClass.id);
    localStorage.removeItem('schueler_trainer_last_class_id');
    closeClassMenuModal();
    await loadClasses();
    showToast('🗑️ Klasse gelöscht');
  }
}

function openFeaturesModal() {
  if (DOM.featuresModal) {
    DOM.featuresModal.classList.add('is-active');
  }
}

function closeFeaturesModal() {
  if (DOM.featuresModal) {
    DOM.featuresModal.classList.remove('is-active');
  }
}

async function handleForceReload() {
  showToast('⚡ Cache wird geleert & App neu geladen...');
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
  } catch (err) {
    console.warn('Cache-Reset Fehler:', err);
  }
  setTimeout(() => {
    window.location.replace(window.location.origin + window.location.pathname + '?r=' + Date.now());
  }, 400);
}

async function handleCheckForUpdates() {
  if (!navigator.onLine) {
    showToast('Keine Internetverbindung (Offline-Betrieb)');
    return;
  }
  showToast('🔍 Prüfe auf Updates...');

  try {
    // 1. Zuerst direkt den Server mit Cache-Buster fragen (index.html & sw.js)
    const [htmlResp, swResp] = await Promise.allSettled([
      fetch('./index.html?t=' + Date.now(), { cache: 'no-store' }),
      fetch('./sw.js?t=' + Date.now(), { cache: 'no-store' })
    ]);

    let remoteHasNewer = false;

    if (htmlResp.status === 'fulfilled' && htmlResp.value.ok) {
      const htmlText = await htmlResp.value.text();
      const vMatch = htmlText.match(/meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
      if (vMatch && vMatch[1] && vMatch[1] !== APP_VERSION) {
        remoteHasNewer = true;
      }
    }

    if (swResp.status === 'fulfilled' && swResp.value.ok) {
      const swText = await swResp.value.text();
      const match = swText.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
      if (match && match[1] && match[1] !== 'klassen-trainer-v11.6') {
        remoteHasNewer = true;
      }
    }

    if (remoteHasNewer) {
      showToast('📥 Neues Update gefunden! Aktualisiere Cache...');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname + '?r=' + Date.now());
      }, 500);
      return;
    }
  } catch (err) {
    console.warn('Server-Direktprüfung:', err);
  }

  // 2. Service Worker Registrierung prüfen
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.installing) {
          showToast('📥 Lade Update herunter...');
          reg.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'installed') {
              showToast('✅ Update bereit! Lade neu...');
              if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              setTimeout(() => window.location.reload(true), 800);
            }
          });
          return;
        }
        if (reg.waiting) {
          showToast('📥 Update bereit! Lade neu...');
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          setTimeout(() => window.location.reload(true), 800);
          return;
        }
      }
      showToast(`✅ App ist aktuell: ${APP_VERSION}`);
    } catch (err) {
      showToast(`✅ Installierte Version: ${APP_VERSION}`);
    }
  } else {
    showToast(`Installierte Version: ${APP_VERSION}`);
  }
}

/* ==========================================================================
   Zwischenablage (Copy to Clipboard für Gemini)
   ========================================================================== */
function copyTextToClipboard(text, successMsg) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      fallbackCopyText(text, successMsg);
    });
  } else {
    fallbackCopyText(text, successMsg);
  }
}

function handleCopyLastName(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent) return;

  const lastName = (currentStudent.lastName || '').trim();
  if (!lastName) {
    showToast('⚠️ Kein Nachname vorhanden');
    return;
  }
  copyTextToClipboard(lastName, `📋 Nachname "${lastName}" kopiert`);
}

function handleCopyAddress(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !currentStudent.address) {
    showToast('⚠️ Keine Anschrift vorhanden');
    return;
  }
  copyTextToClipboard(currentStudent.address, `📋 Adresse kopiert`);
}

function handleCopyPhone(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !currentStudent.phone) {
    showToast('⚠️ Keine Telefonnummer vorhanden');
    return;
  }
  copyTextToClipboard(currentStudent.phone, `📋 Telefonnummer kopiert`);
}

function handleCopyEmail(e) {
  if (e) e.stopPropagation();
  const currentStudent = store.getCurrentStudent();
  if (!currentStudent || !currentStudent.email) {
    showToast('⚠️ Keine E-Mail-Adresse vorhanden');
    return;
  }
  copyTextToClipboard(currentStudent.email, `📋 E-Mail "${currentStudent.email}" kopiert`);
}

function fallbackCopyText(text, successMsg = '📋 Text kopiert') {
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch (_) {
    showToast('⚠️ Kopieren fehlgeschlagen');
  }
  document.body.removeChild(temp);
}

/* ==========================================================================
   Excel- & CSV-Import Handler
   ========================================================================== */
async function handleExcelFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  let { currentClass } = store.getState();

  // Falls noch keine Klasse existiert, automatisch eine Klasse basierend auf dem Dateinamen anlegen
  if (!currentClass) {
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Neue Klasse';
    const newClass = {
      id: 'cls_' + Date.now(),
      name: rawName,
      createdAt: Date.now()
    };
    await db.saveClass(newClass);
    localStorage.setItem('schueler_trainer_last_class_id', newClass.id);
    await loadClasses();
    await selectClass(newClass.id);
    currentClass = store.getState().currentClass;
  }

  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  showToast(isPdf ? '⏳ Lese PDF-Klassenliste ein...' : '⏳ Verarbeite Datei...');

  try {
    const existingStudents = await db.getStudentsByClass(currentClass.id);
    let result;

    if (isPdf) {
      const { processPdfImport } = await import('./pdf-importer.js');
      result = await processPdfImport(file, existingStudents, currentClass.id);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      result = await processExcelImport(arrayBuffer, existingStudents, currentClass.id);
    }

    // Aktualisierte Schüler speichern
    for (const student of result.updatedStudents) {
      await db.saveStudent(student);
    }

    // Neu angelegte Schüler speichern (nur bei vormals ganz leerer Klasse)
    for (const student of result.newStudents) {
      await db.saveStudent(student);
    }

    await loadStudentsForClass(currentClass.id);

    const updatedCount = result.updatedStudents.length;
    const newCount = result.newStudents.length;
    const formatLabel = isPdf ? 'PDF' : 'Liste';

    if (updatedCount > 0 && newCount > 0) {
      showToast(`✅ ${formatLabel}: ${updatedCount} Schüler aktualisiert & bereinigt, ${newCount} neu angelegt!`);
    } else if (updatedCount > 0) {
      const ignoredCount = (result.totalRows || 0) - updatedCount;
      const extraInfo = ignoredCount > 0 ? ` (${ignoredCount} Schüler ohne Foto in der Datei)` : '';
      showToast(`✅ ${formatLabel}: ${updatedCount} Schüler mit Stammdaten verknüpft & bereinigt!${extraInfo}`);
    } else if (newCount > 0) {
      showToast(`✅ ${formatLabel}: ${newCount} Schüler neu importiert!`);
    } else {
      showToast('ℹ️ Keine passenden Schülerdaten gefunden.');
    }
  } catch (err) {
    console.error('Fehler beim Listen-Import:', err);
    alert(`Import fehlgeschlagen: ${err.message}`);
  } finally {
    DOM.excelFileInput.value = '';
  }
}

/* ==========================================================================
   Toast Benachrichtigungen
   ========================================================================== */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2400);
}
