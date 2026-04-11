import { useEffect, useRef, useCallback } from 'react';
import type { HandData, GestureType } from '@/hooks/useHandTracking';

interface GestureControllerProps {
  handData: HandData;
  enabled: boolean;
}

/**
 * Translates hand gestures into DOM interactions:
 * - Point → hover/move cursor
 * - Pinch → click element under cursor
 * - Open palm → scroll
 * - Peace → toggle sidebar/menu
 */
export function GestureController({ handData, enabled }: GestureControllerProps) {
  const lastClickTime = useRef(0);
  const lastGesture = useRef<GestureType>('none');
  const scrollAccum = useRef({ x: 0, y: 0 });
  const prevPos = useRef({ x: 0.5, y: 0.5 });
  const virtualCursorRef = useRef<HTMLDivElement | null>(null);

  // Create virtual cursor
  useEffect(() => {
    if (!enabled) {
      if (virtualCursorRef.current) {
        virtualCursorRef.current.remove();
        virtualCursorRef.current = null;
      }
      return;
    }

    const cursor = document.createElement('div');
    cursor.id = 'gesture-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid hsl(var(--primary));
      background: hsl(var(--primary) / 0.2);
      pointer-events: none;
      z-index: 99999;
      transition: transform 0.1s ease-out, opacity 0.2s;
      transform: translate(-50%, -50%);
      opacity: 0;
      box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
    `;
    document.body.appendChild(cursor);
    virtualCursorRef.current = cursor;

    return () => {
      cursor.remove();
      virtualCursorRef.current = null;
    };
  }, [enabled]);

  // Handle gesture interactions
  useEffect(() => {
    if (!enabled || !handData.isActive || !virtualCursorRef.current) {
      if (virtualCursorRef.current) {
        virtualCursorRef.current.style.opacity = '0';
      }
      return;
    }

    const cursor = virtualCursorRef.current;
    const screenX = (1 - handData.indexTip.x) * window.innerWidth;
    const screenY = handData.indexTip.y * window.innerHeight;

    cursor.style.left = `${screenX}px`;
    cursor.style.top = `${screenY}px`;
    cursor.style.opacity = '1';

    // Gesture-based cursor styling
    switch (handData.gesture) {
      case 'pinch':
        cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
        cursor.style.background = 'hsl(var(--primary) / 0.5)';
        break;
      case 'point':
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.background = 'hsl(var(--primary) / 0.2)';
        break;
      case 'fist':
        cursor.style.transform = 'translate(-50%, -50%) scale(0.5)';
        cursor.style.background = 'hsl(0 84% 60% / 0.3)';
        break;
      default:
        cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
        cursor.style.background = 'hsl(var(--primary) / 0.1)';
    }

    // Pinch = click
    if (handData.gesture === 'pinch' && lastGesture.current !== 'pinch') {
      const now = Date.now();
      if (now - lastClickTime.current > 500) {
        lastClickTime.current = now;
        const el = document.elementFromPoint(screenX, screenY);
        if (el && el.id !== 'gesture-cursor') {
          // Dispatch click
          el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            clientX: screenX,
            clientY: screenY,
            view: window,
          }));

          // Visual feedback
          cursor.style.boxShadow = '0 0 24px hsl(var(--primary) / 0.8)';
          setTimeout(() => {
            if (cursor) cursor.style.boxShadow = '0 0 12px hsl(var(--primary) / 0.4)';
          }, 200);
        }
      }
    }

    // Open palm = scroll
    if (handData.gesture === 'open_palm') {
      const dx = handData.palmCenter.x - prevPos.current.x;
      const dy = handData.palmCenter.y - prevPos.current.y;
      window.scrollBy({
        left: dx * -800,
        top: dy * 800,
        behavior: 'auto',
      });
    }

    prevPos.current = { x: handData.palmCenter.x, y: handData.palmCenter.y };
    lastGesture.current = handData.gesture;
  }, [handData, enabled]);

  return null;
}
