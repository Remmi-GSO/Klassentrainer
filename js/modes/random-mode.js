import { store } from '../store.js';

/**
 * Fisher-Yates Zufallsmischung
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initRandomMode(students, initialIndex = 0) {
  const shuffled = shuffleArray(students);
  const validIndex = (initialIndex >= 0 && initialIndex < shuffled.length) ? initialIndex : 0;
  store.setState({
    students: shuffled,
    currentIndex: validIndex,
    isFlipped: false
  });
}

export function randomNext() {
  const { students, currentIndex } = store.getState();
  if (students.length === 0) return;
  const nextIndex = (currentIndex + 1) % students.length;
  store.setState({ currentIndex: nextIndex, isFlipped: false });
}

export function randomPrev() {
  const { students, currentIndex } = store.getState();
  if (students.length === 0) return;
  const prevIndex = (currentIndex - 1 + students.length) % students.length;
  store.setState({ currentIndex: prevIndex, isFlipped: false });
}
