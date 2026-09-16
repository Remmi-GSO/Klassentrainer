/**
 * Leichtgewichtiger, reaktiver State-Store für die gesamte App
 * Basiert auf dem nativen EventTarget-Muster
 */

class AppStore extends EventTarget {
  constructor() {
    super();
    this.state = {
      classes: [],
      currentClass: null,
      students: [],
      currentMode: 'alpha', // 'alpha' | 'random' | 'leitner'
      currentIndex: 0,
      isFlipped: false,
      
      // Leitner Session State
      leitnerQueue: [],
      leitnerSessionStats: {
        initialCount: 0,
        mastered: 0,
        deferred: 0
      }
    };
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.dispatchEvent(new CustomEvent('stateChange', { detail: this.state }));
  }

  on(eventName, callback) {
    this.addEventListener(eventName, callback);
  }

  emit(eventName, data) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  getCurrentStudent() {
    const { currentMode, students, currentIndex, leitnerQueue } = this.state;
    if (currentMode === 'leitner') {
      return leitnerQueue[currentIndex] || null;
    }
    return students[currentIndex] || null;
  }
}

export const store = new AppStore();
