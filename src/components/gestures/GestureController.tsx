import { useEffect, useRef } from 'react';
import type { HandData, GestureType } from '@/hooks/useHandTracking';

interface GestureControllerProps {
  handData: HandData;
  enabled: boolean;
}

/**
 * Translates hand gestures into DOM interactions:
 * - Point → move cursor + click on depth push (z-axis)
 * - Pinch → zoom in/out or pan the page
 * - Open palm → scroll page
 * - Fist → open palm transition = zoom burst
 */
export function GestureController({ handData, enabled }: GestureControllerProps) {
  const lastGesture = useRef<GestureType>('none');
  const prevPos = useRef({ x: 0.5, y: 0.5 });
  const prevZ = useRef(0);
  const virtualCursorRef = useRef<HTMLDivElement | null>(null);
  const clickCooldown = useRef(0);
  const pinchStartDistance = useRef<number | null>(null);
  const scrollAccum = useRef({ x: 0, y: 0 });
  const smoothPos = useRef({ x: 0.5, y: 0.5 });
  const zoomLevel = useRef(1);

  // Create virtual cursor
  useEffect(() => {
    if (!enabled) {
      if (virtualCursorRef.current) {
        virtualCursorRef.current.remove();
        virtualCursorRef.current = null;
      }
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      zoomLevel.current = 1;
      return;
    }

    const cursor = document.createElement('div');
    cursor.id = 'gesture-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid hsl(var(--primary));
      background: hsl(var(--primary) / 0.15);
      pointer-events: none;
      z-index: 99999;
      transition: width 0.15s, height 0.15s, background 0.15s, box-shadow 0.15s;
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

  // Main gesture loop
  useEffect(() => {
    if (!enabled || !handData.isActive || !virtualCursorRef.current) {
      if (virtualCursorRef.current) {
        virtualCursorRef.current.style.opacity = '0';
      }
      return;
    }

    const cursor = virtualCursorRef.current;

    // Smooth cursor position (lerp)
    const lerpFactor = 0.3;
    smoothPos.current.x += ((1 - handData.indexTip.x) - smoothPos.current.x) * lerpFactor;
    smoothPos.current.y += (handData.indexTip.y - smoothPos.current.y) * lerpFactor;

    const screenX = smoothPos.current.x * window.innerWidth;
    const screenY = smoothPos.current.y * window.innerHeight;

    cursor.style.left = `${screenX}px`;
    cursor.style.top = `${screenY}px`;
    cursor.style.opacity = '1';

    const gesture = handData.gesture;
    const prevGest = lastGesture.current;

    // === POINT: Move cursor, click on Z-depth push ===
    if (gesture === 'point') {
      cursor.style.width = '28px';
      cursor.style.height = '28px';
      cursor.style.background = 'hsl(var(--primary) / 0.2)';
      cursor.style.boxShadow = '0 0 12px hsl(var(--primary) / 0.4)';
      cursor.style.borderColor = 'hsl(var(--primary))';

      // Detect Z-push (finger moving toward camera = smaller z value)
      if (handData.landmarks.length >= 9) {
        const currentZ = handData.landmarks[8].z;
        const zDelta = prevZ.current - currentZ;

        // Z push threshold for click
        if (zDelta > 0.02 && Date.now() - clickCooldown.current > 600) {
          clickCooldown.current = Date.now();
          triggerClick(screenX, screenY, cursor);
        }
        prevZ.current = currentZ;
      }

      // Also hover effect
      const el = document.elementFromPoint(screenX, screenY);
      if (el && el.id !== 'gesture-cursor') {
        el.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, clientX: screenX, clientY: screenY, view: window,
        }));
      }
    }

    // === PINCH: Zoom or pan ===
    if (gesture === 'pinch') {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.background = 'hsl(142 76% 36% / 0.4)';
      cursor.style.boxShadow = '0 0 20px hsl(142 76% 36% / 0.6)';
      cursor.style.borderColor = 'hsl(142 76% 36%)';

      if (prevGest !== 'pinch') {
        // Pinch just started
        pinchStartDistance.current = handData.pinchDistance;
      } else {
        // Pinch ongoing: use palm movement to scroll/pan
        const dx = handData.palmCenter.x - prevPos.current.x;
        const dy = handData.palmCenter.y - prevPos.current.y;

        const scrollX = dx * -1200;
        const scrollY = dy * 1200;

        // Accumulate for smoother scroll
        scrollAccum.current.x += scrollX;
        scrollAccum.current.y += scrollY;

        if (Math.abs(scrollAccum.current.x) > 2 || Math.abs(scrollAccum.current.y) > 2) {
          window.scrollBy({
            left: scrollAccum.current.x,
            top: scrollAccum.current.y,
            behavior: 'auto',
          });
          scrollAccum.current = { x: 0, y: 0 };
        }
      }
    }

    // === OPEN PALM: Scroll the page ===
    if (gesture === 'open_palm') {
      cursor.style.width = '36px';
      cursor.style.height = '36px';
      cursor.style.background = 'hsl(217 91% 60% / 0.25)';
      cursor.style.boxShadow = '0 0 24px hsl(217 91% 60% / 0.5)';
      cursor.style.borderColor = 'hsl(217 91% 60%)';

      const dx = handData.palmCenter.x - prevPos.current.x;
      const dy = handData.palmCenter.y - prevPos.current.y;

      // Only scroll if there's meaningful movement
      if (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003) {
        window.scrollBy({
          left: dx * -1500,
          top: dy * 1500,
          behavior: 'auto',
        });
      }
    }

    // === FIST → OPEN PALM: Zoom burst effect ===
    if (gesture === 'open_palm' && prevGest === 'fist') {
      // Zoom in at cursor position
      zoomLevel.current = Math.min(zoomLevel.current + 0.3, 2.5);
      applyZoom(screenX, screenY);

      // Visual burst
      cursor.style.boxShadow = '0 0 60px hsl(var(--primary) / 0.9)';
      setTimeout(() => {
        if (cursor) cursor.style.boxShadow = '0 0 24px hsl(217 91% 60% / 0.5)';
      }, 400);
    }

    // === FIST: Hold / zoom out on release ===
    if (gesture === 'fist') {
      cursor.style.width = '16px';
      cursor.style.height = '16px';
      cursor.style.background = 'hsl(0 84% 60% / 0.4)';
      cursor.style.boxShadow = '0 0 16px hsl(0 84% 60% / 0.5)';
      cursor.style.borderColor = 'hsl(0 84% 60%)';
    }

    // === PEACE: Reset zoom ===
    if (gesture === 'peace') {
      cursor.style.width = '32px';
      cursor.style.height = '32px';
      cursor.style.background = 'hsl(280 80% 60% / 0.3)';
      cursor.style.boxShadow = '0 0 20px hsl(280 80% 60% / 0.5)';
      cursor.style.borderColor = 'hsl(280 80% 60%)';

      if (prevGest !== 'peace') {
        // Reset zoom
        zoomLevel.current = 1;
        document.body.style.transition = 'transform 0.4s ease-out';
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = 'center center';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 400);
      }
    }

    prevPos.current = { x: handData.palmCenter.x, y: handData.palmCenter.y };
    lastGesture.current = gesture;
  }, [handData, enabled]);

  return null;
}

function triggerClick(x: number, y: number, cursor: HTMLDivElement) {
  const el = document.elementFromPoint(x, y);
  if (el && el.id !== 'gesture-cursor') {
    // Hover first
    el.dispatchEvent(new MouseEvent('mouseenter', {
      bubbles: true, clientX: x, clientY: y, view: window,
    }));
    el.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true, clientX: x, clientY: y, view: window,
    }));
    el.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true, clientX: x, clientY: y, view: window,
    }));
    el.dispatchEvent(new MouseEvent('click', {
      bubbles: true, clientX: x, clientY: y, view: window,
    }));

    // Focus if focusable
    if (el instanceof HTMLElement && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT')) {
      el.focus();
    }

    // Visual click feedback
    cursor.style.boxShadow = '0 0 40px hsl(var(--primary) / 0.9)';
    cursor.style.background = 'hsl(var(--primary) / 0.6)';
    setTimeout(() => {
      cursor.style.boxShadow = '0 0 12px hsl(var(--primary) / 0.4)';
      cursor.style.background = 'hsl(var(--primary) / 0.2)';
    }, 250);
  }
}

function applyZoom(originX: number, originY: number) {
  const zoom = Math.min(Math.max(1, 1 + (arguments.length > 2 ? 0.3 : 0.3)), 2.5);
  document.body.style.transition = 'transform 0.3s ease-out';
  document.body.style.transformOrigin = `${originX}px ${originY}px`;
  document.body.style.transform = `scale(${zoom})`;
  setTimeout(() => {
    document.body.style.transition = '';
  }, 300);
}
