import { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vx: number, vz: number) => void;
}

export function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const keysDownRef = useRef<Set<string>>(new Set());

  // Keyboard navigation handler (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        keysDownRef.current.add(key);
        updateFromKeys();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysDownRef.current.has(key)) {
        keysDownRef.current.delete(key);
        updateFromKeys();
      }
    };

    const updateFromKeys = () => {
      const keys = keysDownRef.current;
      let vx = 0;
      let vz = 0;

      if (keys.has('w') || keys.has('arrowup')) vz -= 1;
      if (keys.has('s') || keys.has('arrowdown')) vz += 1;
      if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
      if (keys.has('d') || keys.has('arrowright')) vx += 1;

      // In isometric view (camera angled 45 degrees):
      // W (up) moves diagonally into the screen (-x, -z)
      // S (down) moves (+x, +z)
      // A (left) moves (-x, +z)
      // D (right) moves (+x, -z)
      const isoX = (vx + vz) * 0.7071;
      const isoZ = (vz - vx) * 0.7071;

      onMove(isoX, isoZ);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove]);

  // Touch and Mouse handlers for the on-screen joystick
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsActive(true);
    startPosRef.current = { x: clientX, y: clientY };
    setKnobPos({ x: 0, y: 0 });
  }, []);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isActive) return;

      const dx = clientX - startPosRef.current.x;
      const dy = clientY - startPosRef.current.y;
      const maxDist = 55;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });

      // Normalize speed (-1 to 1) and map to Isometric world axes
      const normVx = kx / maxDist;
      const normVy = ky / maxDist;

      // Convert screen vector to isometric 45-degree world vector
      const isoX = (normVx + normVy) * 0.7071;
      const isoZ = (normVy - normVx) * 0.7071;

      onMove(isoX, isoZ);
    },
    [isActive, onMove]
  );

  const handleEnd = useCallback(() => {
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove(0, 0);
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-6 z-30 flex items-center justify-center select-none touch-none"
      onTouchStart={(e) => {
        const touch = e.changedTouches[0];
        touchIdRef.current = touch.identifier;
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchIdRef.current) {
            handleMove(touch.clientX, touch.clientY);
            break;
          }
        }
      }}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => {
        if (e.buttons === 1) {
          handleMove(e.clientX, e.clientY);
        }
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* Outer Joystick Base */}
      <div className="relative w-32 h-32 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-emerald-500/40 shadow-xl flex items-center justify-center">
        {/* Direction Cross Markings */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-0.5 bg-white/10" />
        <div className="absolute inset-y-3 left-1/2 -translate-x-1/2 w-0.5 bg-white/10" />

        {/* Inner Moveable Knob */}
        <div
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border border-white/60 shadow-lg flex items-center justify-center transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}
