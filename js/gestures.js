/**
 * Hochperformante Touch-, Stylus (S-Pen) & Gesten-Engine für das Samsung Galaxy S23 Ultra (120Hz)
 * Nutzt moderne Pointer Events für perfekte Finger-, Stift- und Maus-Bedienung.
 */

export function setupCardGestures(cardElement, callbacks) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isDragging = false;
  let isPointerDown = false;
  let startTime = 0;
  let activePointerId = null;

  const DRAG_START_THRESHOLD = 14; // px (verhindert, dass Fingertippen als Drag gewertet wird)
  const TAP_MAX_DISTANCE = 18;     // px
  const TAP_MAX_DURATION = 400;    // ms
  const SWIPE_THRESHOLD = 50;      // px
  const MAX_ROTATION = 12;         // deg

  function onPointerDown(e) {
    // Ignoriere Klicks auf interaktive Steuerelemente
    if (
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('textarea') ||
      e.target.closest('select') ||
      e.target.closest('a') ||
      e.target.closest('#frontNameBar') ||
      e.target.closest('#frontMnemonicOverlay') ||
      e.target.closest('#frontMnemonicBtn') ||
      e.target.closest('#frontAudioBtn')
    ) {
      return;
    }

    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;
    startTime = Date.now();
    isPointerDown = true;
    isDragging = false;
    activePointerId = e.pointerId;

    try {
      cardElement.setPointerCapture(e.pointerId);
    } catch (_) {}

    cardElement.style.transition = 'none';
  }

  function onPointerMove(e) {
    if (!isPointerDown || e.pointerId !== activePointerId) return;

    currentX = e.clientX;
    currentY = e.clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const isFlipped = cardElement.classList.contains('is-flipped');

    if (Math.abs(deltaX) > DRAG_START_THRESHOLD || Math.abs(deltaY) > DRAG_START_THRESHOLD) {
      isDragging = true;
    }

    if (isDragging) {
      const rotation = (deltaX / 280) * MAX_ROTATION;
      const opacity = Math.max(0.65, 1 - Math.abs(deltaX) / 700);
      
      const baseRotationY = isFlipped ? 'rotateY(180deg) translateZ(1px)' : 'rotateY(0deg) translateZ(1px)';

      cardElement.style.transform = `translate3d(${deltaX * 0.85}px, ${deltaY * 0.35}px, 0) rotateZ(${rotation}deg) ${baseRotationY}`;
      cardElement.style.opacity = opacity;

      if (callbacks.onDrag) {
        callbacks.onDrag(deltaX, deltaY);
      }
    }
  }

  function onPointerUp(e) {
    if (!isPointerDown || e.pointerId !== activePointerId) return;
    isPointerDown = false;

    try {
      cardElement.releasePointerCapture(e.pointerId);
    } catch (_) {}
    activePointerId = null;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const deltaTime = Date.now() - startTime;
    const isFlipped = cardElement.classList.contains('is-flipped');

    // Sanfter Reset mit Federeffekt
    cardElement.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease';
    
    const baseRotationY = isFlipped ? 'rotateY(180deg) translateZ(1px)' : 'rotateY(0deg) translateZ(1px)';

    cardElement.style.transform = `translate3d(0, 0, 0) ${baseRotationY}`;
    cardElement.style.opacity = '1';

    if (callbacks.onDragEnd) {
      callbacks.onDragEnd();
    }

    // Tap-Erkennung (Kurzer Fingertipp auf Vorder- oder Rückseite)
    if (!isDragging && deltaTime < TAP_MAX_DURATION && Math.abs(deltaX) < TAP_MAX_DISTANCE && Math.abs(deltaY) < TAP_MAX_DISTANCE) {
      if (callbacks.onTap) callbacks.onTap();
      return;
    }

    // Dominante Achse auswerten
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        if (callbacks.onSwipeLeft) callbacks.onSwipeLeft();
      } else {
        if (callbacks.onSwipeRight) callbacks.onSwipeRight();
      }
    } else if (!isHorizontal && Math.abs(deltaY) > SWIPE_THRESHOLD) {
      // Vertikaler Swipe dreht die Karte auf BEIDEN Seiten sofort um!
      if (callbacks.onSwipeVertical) {
        callbacks.onSwipeVertical();
      }
    }
  }

  function onPointerCancel(e) {
    if (e.pointerId === activePointerId) {
      onPointerUp(e);
    }
  }

  // Pointer Events binden (deckt Touch, Stylus S-Pen und Maus ab!)
  cardElement.addEventListener('pointerdown', onPointerDown);
  cardElement.addEventListener('pointermove', onPointerMove);
  cardElement.addEventListener('pointerup', onPointerUp);
  cardElement.addEventListener('pointercancel', onPointerCancel);
}
