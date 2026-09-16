import { store } from '../store.js';

export function initAlphaMode(students, initialIndex = 0) {
  // Sortiere alphabetisch nach Nachname, dann Vorname
  const sorted = [...students].sort((a, b) => {
    const lastA = (a.lastName || '').toLowerCase();
    const lastB = (b.lastName || '').toLowerCase();
    if (lastA !== lastB) return lastA.localeCompare(lastB, 'de');
    return (a.firstName || '').localeCompare(b.firstName || '', 'de');
  });

  const validIndex = (initialIndex >= 0 && initialIndex < sorted.length) ? initialIndex : 0;

  store.setState({
    students: sorted,
    currentIndex: validIndex,
    isFlipped: false
  });
}

export function alphaNext() {
  const { students, currentIndex } = store.getState();
  if (students.length === 0) return;
  const nextIndex = (currentIndex + 1) % students.length;
  store.setState({ currentIndex: nextIndex, isFlipped: false });
}

export function alphaPrev() {
  const { students, currentIndex } = store.getState();
  if (students.length === 0) return;
  const prevIndex = (currentIndex - 1 + students.length) % students.length;
  store.setState({ currentIndex: prevIndex, isFlipped: false });
}
