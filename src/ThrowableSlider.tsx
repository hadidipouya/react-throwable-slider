import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  forwardRef,
  useImperativeHandle,
} from 'react';

/**
 * Interface representing the customization props for ThrowableSlider
 */
export interface ThrowableSliderProps {
  /** Label describing the slider parameter */
  label: string;
  /** Unit suffix to append after the numeric value (e.g., '%', '°', ' dB', ' EV') */
  unit?: string;
  /** Minimum selectable value */
  min?: number;
  /** Maximum selectable value */
  max?: number;
  /** Quantization step interval (e.g. 1, 0.1) */
  step?: number;
  /** Default initial value (uncontrolled mode) */
  defaultValue?: number;
  /** Controlled value */
  value?: number;
  /** Whether to prepend '+' for positive values */
  signed?: boolean;
  /** Downward gravitational acceleration during projectile flight */
  gravity?: number;
  /** Impulse launch power multiplier */
  launchPower?: number;
  /** Accent color for elastic bands, trajectories, and glow rings */
  accentColor?: string;
  /** Fires continuously when thumb position changes */
  onInput?: (value: number) => void;
  /** Fires when dragging or projectile flight completes */
  onChange?: (value: number) => void;
  /** Disable interactions */
  disabled?: boolean;
  /** Optional custom class name */
  className?: string;
}

/**
 * Handle ref for external programmatic control
 */
export interface ThrowableSliderHandle {
  reset: () => void;
  getValue: () => number;
}

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface ImpactRipple {
  x: number;
  radius: number;
  alpha: number;
}

function quantize(val: number, min: number, max: number, step: number): number {
  const steps = Math.round((val - min) / step);
  const raw = min + steps * step;
  const precision = step.toString().split('.')[1]?.length || 0;
  return Math.min(max, Math.max(min, parseFloat(raw.toFixed(precision))));
}

function formatDisplay(
  val: number,
  step: number,
  unit: string,
  signed: boolean,
): string {
  const precision = step.toString().split('.')[1]?.length || 0;
  let s = precision > 0 ? val.toFixed(precision) : Math.round(val).toString();
  if (signed && val > 0) s = `+${s}`;
  return `${s}${unit}`;
}

export const ThrowableSlider = forwardRef<
  ThrowableSliderHandle,
  ThrowableSliderProps
>(
  (
    {
      label,
      unit = '',
      min = 0,
      max = 100,
      step = 1,
      defaultValue,
      value: controlledValue,
      signed = false,
      gravity = 0.68,
      launchPower = 0.14,
      accentColor = '#6366f1',
      onInput,
      onChange,
      disabled = false,
      className = '',
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const initialVal = isControlled ? controlledValue : (defaultValue ?? min);
    const [internalVal, setInternalVal] = useState<number>(
      quantize(initialVal, min, max, step),
    );
    const currentVal = isControlled
      ? quantize(controlledValue, min, max, step)
      : internalVal;

    const [isAiming, setIsAiming] = useState(false);
    const isAimingRef = useRef(false);
    const [predictedVal, setPredictedVal] = useState<number>(currentVal);

    const sliderId = useId();
    const trackRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);

    // Dynamic Physics & Trajectory Internal Mutable State
    const phys = useRef({
      inFlight: false,
      trackWidth: 300,
      trackCanvasY: 140, // Middle of high-res canvas (280px total height)
      originX: 0,
      dragX: 0,
      dragY: 0,
      flightX: 0,
      flightY: 0,
      vx: 0,
      vy: 0,
      trail: [] as TrailPoint[],
      ripple: null as ImpactRipple | null,
    });

    const updateThumbPosition = useCallback((x: number, y: number) => {
      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate3d(${x - 7}px, ${y - 7}px, 0)`;
      }
    }, []);

    const valToX = useCallback(
      (v: number) => {
        const ratio = (v - min) / (max - min);
        return ratio * phys.current.trackWidth;
      },
      [min, max],
    );

    const xToVal = useCallback(
      (x: number) => {
        const clampedX = Math.max(0, Math.min(phys.current.trackWidth, x));
        const raw = min + (clampedX / phys.current.trackWidth) * (max - min);
        return quantize(raw, min, max, step);
      },
      [min, max, step],
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        const resetVal = defaultValue ?? min;
        if (!isControlled) setInternalVal(resetVal);
        updateThumbPosition(valToX(resetVal), 0);
        onChange?.(resetVal);
      },
      getValue: () => currentVal,
    }));

    // Keep thumb in sync with value changes during idle state
    useEffect(() => {
      if (!isAimingRef.current && !phys.current.inFlight) {
        updateThumbPosition(valToX(currentVal), 0);
      }
    }, [currentVal, valToX, updateThumbPosition]);

    const renderOverlay = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = phys.current.trackWidth;
      ctx.clearRect(0, 0, w, 280);

      const { trackCanvasY, ripple, trail } = phys.current;

      // 1. Draw motion trail during flight
      if (trail.length > 1) {
        ctx.save();
        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i];
          const radius = 2 + (i / trail.length) * 3.5;
          ctx.beginPath();
          ctx.arc(pt.x, trackCanvasY + pt.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = pt.alpha * 0.6;
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Draw landing impact ripple
      if (ripple) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          ripple.x,
          trackCanvasY,
          ripple.radius * 1.6,
          ripple.radius * 0.8,
          0,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ripple.alpha;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw aiming rubber bands, trajectory arc, and landing spot
      if (isAimingRef.current) {
        const { originX, dragX, dragY } = phys.current;

        // Rubber elastic bands
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(originX - 10, trackCanvasY);
        ctx.lineTo(dragX, trackCanvasY + dragY);
        ctx.lineTo(originX + 10, trackCanvasY);
        ctx.stroke();

        // Parabolic trajectory prediction (launching upward into sky)
        const vx = (originX - dragX) * launchPower;
        const vy = -Math.abs(dragY) * launchPower;

        let cx = dragX;
        let cy = dragY;
        let cvy = vy;
        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < 90; i++) {
          points.push({ x: cx, y: cy });
          cx += vx;
          cy += cvy;
          cvy += gravity;

          if (cvy > 0 && cy >= 0) {
            points.push({ x: cx, y: 0 });
            break;
          }
        }

        // Dotted trajectory curve
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        points.forEach((p, idx) => {
          const py = trackCanvasY + p.y;
          if (idx === 0) ctx.moveTo(p.x, py);
          else ctx.lineTo(p.x, py);
        });
        ctx.stroke();
        ctx.restore();

        // Landing target pin & readout
        const landX = Math.max(0, Math.min(w, cx));
        const pred = xToVal(landX);

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(landX, trackCanvasY - 8);
        ctx.lineTo(landX, trackCanvasY + 8);
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = '600 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          formatDisplay(pred, step, unit, signed),
          landX,
          trackCanvasY - 14,
        );
      }
    }, [
      accentColor,
      launchPower,
      gravity,
      xToVal,
      step,
      unit,
      signed,
    ]);

    const stopAnimation = useCallback(() => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }, []);

    const startAnimation = useCallback(() => {
      if (animRef.current !== null) return;

      const loop = () => {
        const p = phys.current;

        // Animate flight physics
        if (p.inFlight) {
          p.flightX += p.vx;
          p.flightY += p.vy;
          p.vy += gravity;

          // Add to motion trail
          p.trail.push({ x: p.flightX, y: p.flightY, alpha: 0.8 });
          if (p.trail.length > 12) p.trail.shift();

          // Directly update thumb position at 60/120 FPS
          updateThumbPosition(p.flightX, p.flightY);

          // Check for landing on track baseline
          if (p.vy > 0 && p.flightY >= 0) {
            p.flightY = 0;
            p.inFlight = false;
            p.flightX = Math.max(0, Math.min(p.trackWidth, p.flightX));
            updateThumbPosition(p.flightX, 0);

            // Trigger landing ripple
            p.ripple = { x: p.flightX, radius: 2, alpha: 1 };

            const finalVal = xToVal(p.flightX);
            if (!isControlled) setInternalVal(finalVal);
            onInput?.(finalVal);
            onChange?.(finalVal);
          }
        }

        // Fade out motion trail
        for (let i = 0; i < p.trail.length; i++) {
          p.trail[i].alpha *= 0.85;
        }
        p.trail = p.trail.filter((pt) => pt.alpha > 0.05);

        // Animate impact ripple
        if (p.ripple) {
          p.ripple.radius += 1.8;
          p.ripple.alpha -= 0.07;
          if (p.ripple.alpha <= 0) {
            p.ripple = null;
          }
        }

        renderOverlay();

        // Continue animation loop if in flight, aiming, or ripples/trails are still active
        const hasActiveEffects = p.trail.length > 0 || p.ripple !== null;
        if (p.inFlight || isAimingRef.current || hasActiveEffects) {
          animRef.current = requestAnimationFrame(loop);
        } else {
          animRef.current = null;
          renderOverlay();
        }
      };

      animRef.current = requestAnimationFrame(loop);
    }, [gravity, isControlled, onInput, onChange, renderOverlay, updateThumbPosition, xToVal]);

    const handleResize = useCallback(() => {
      if (!trackRef.current || !canvasRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const w = rect.width || 300;
      phys.current.trackWidth = w;

      const dpr =
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const canvas = canvasRef.current;
      canvas.width = w * dpr;
      canvas.height = 280 * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `280px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }

      if (!isAimingRef.current && !phys.current.inFlight) {
        updateThumbPosition(valToX(currentVal), 0);
      }
      renderOverlay();
    }, [renderOverlay, updateThumbPosition, valToX, currentVal]);

    useEffect(() => {
      handleResize();

      if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
        const ro = new ResizeObserver(() => handleResize());
        ro.observe(trackRef.current);
        return () => ro.disconnect();
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
      isAimingRef.current = isAiming;
      if (isAiming) {
        startAnimation();
      }
    }, [isAiming, startAnimation]);

    useEffect(() => {
      return () => stopAnimation();
    }, [stopAnimation]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || phys.current.inFlight) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsAiming(true);
      isAimingRef.current = true;
      const origin = valToX(currentVal);
      phys.current.originX = origin;
      phys.current.dragX = origin;
      phys.current.dragY = 0;
      setPredictedVal(currentVal);
      updateThumbPosition(origin, 0);
      startAnimation();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isAiming || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - (rect.top + rect.height / 2);

      // Normal precision drag if near horizontal baseline
      if (Math.abs(curY) < 6) {
        const directVal = xToVal(curX);
        const directX = valToX(directVal);
        phys.current.originX = directX;
        phys.current.dragX = directX;
        phys.current.dragY = 0;
        updateThumbPosition(directX, 0);
        if (!isControlled) setInternalVal(directVal);
        setPredictedVal(directVal);
        onInput?.(directVal);
        return;
      }

      // Slingshot aiming drag
      phys.current.dragX = curX;
      phys.current.dragY = curY;
      updateThumbPosition(curX, curY);

      // Calculate landing prediction for header readout
      const vx = (phys.current.originX - curX) * launchPower;
      const vy = -Math.abs(curY) * launchPower;
      let simX = curX;
      let simY = curY;
      let simVy = vy;
      for (let i = 0; i < 90; i++) {
        simX += vx;
        simY += simVy;
        simVy += gravity;
        if (simVy > 0 && simY >= 0) break;
      }
      const landVal = xToVal(simX);
      setPredictedVal(landVal);
    };

    const handlePointerUp = () => {
      if (!isAiming) return;
      setIsAiming(false);
      isAimingRef.current = false;

      if (Math.abs(phys.current.dragY) > 8) {
        // Launch ballistics flight
        const p = phys.current;
        p.inFlight = true;
        p.flightX = p.dragX;
        p.flightY = p.dragY;
        p.vx = (p.originX - p.dragX) * launchPower;
        p.vy = -Math.abs(p.dragY) * launchPower;
        p.trail = [];
        startAnimation();
      } else {
        const finalVal = xToVal(phys.current.dragX);
        if (!isControlled) setInternalVal(finalVal);
        updateThumbPosition(valToX(finalVal), 0);
        onInput?.(finalVal);
        onChange?.(finalVal);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || phys.current.inFlight) return;
      let nextVal: number;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        nextVal = Math.min(max, currentVal + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        nextVal = Math.max(min, currentVal - step);
      } else if (e.key === 'Home') {
        nextVal = min;
      } else if (e.key === 'End') {
        nextVal = max;
      } else {
        return;
      }
      e.preventDefault();
      if (!isControlled) setInternalVal(nextVal);
      updateThumbPosition(valToX(nextVal), 0);
      onInput?.(nextVal);
      onChange?.(nextVal);
    };

    return (
      <div
        className={`flex flex-col gap-2 w-full select-none ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}
      >
        {/* Label & Active Value Header */}
        <div className="flex items-center justify-between text-xs font-medium tracking-wide">
          <label
            id={`${sliderId}-label`}
            htmlFor={`${sliderId}-track`}
            className="text-neutral-400 dark:text-neutral-400 cursor-pointer"
          >
            {label}
          </label>
          <span
            className="font-mono tabular-nums transition-colors"
            style={{ color: isAiming ? accentColor : undefined }}
          >
            {isAiming
              ? formatDisplay(predictedVal, step, unit, signed)
              : formatDisplay(currentVal, step, unit, signed)}
          </span>
        </div>

        {/* Track, Canvas & Thumb Area */}
        <div
          ref={trackRef}
          id={`${sliderId}-track`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-orientation="horizontal"
          aria-labelledby={`${sliderId}-label`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentVal}
          aria-valuetext={formatDisplay(currentVal, step, unit, signed)}
          onKeyDown={handleKeyDown}
          className="relative w-full h-8 flex items-center cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-md"
          style={{ touchAction: 'none' }}
        >
          {/* Track Baseline */}
          <div className="w-full h-[2px] bg-neutral-200 dark:bg-neutral-800 rounded-full pointer-events-none" />

          {/* Trajectory Canvas Overlay (positioned so y=140 aligns exactly with the 16px track center) */}
          <canvas
            ref={canvasRef}
            className="absolute -top-[124px] left-0 pointer-events-none z-10"
          />

          {/* Interactive Knob / Thumb */}
          <div
            ref={thumbRef}
            id={`${sliderId}-thumb`}
            className="absolute top-1/2 left-0 w-3.5 h-3.5 rounded-full bg-white shadow-md pointer-events-none z-20"
            style={{
              boxShadow: `0 0 10px ${accentColor}88`,
              transform: `translate3d(${valToX(currentVal) - 7}px, -7px, 0)`,
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    );
  },
);

ThrowableSlider.displayName = 'ThrowableSlider';
export default ThrowableSlider;
