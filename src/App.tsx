import { useState, useRef } from 'react';
import {
  ThrowableSlider,
  type ThrowableSliderHandle,
} from './ThrowableSlider';

export default function App() {
  // Playground state
  const [gravity, setGravity] = useState(0.68);
  const [launchPower, setLaunchPower] = useState(0.14);
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Programmatic Handle
  const heroSliderRef = useRef<ThrowableSliderHandle>(null);
  const [heroValue, setHeroValue] = useState(50);
  const [flightStatus, setFlightStatus] = useState<'idle' | 'aiming' | 'flying'>('idle');

  // Controlled Slider Demo
  const [controlledVal, setControlledVal] = useState(65);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const colors = [
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Purple', hex: '#a855f7' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background radial subtle glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-neutral-950 to-neutral-950 -z-10" />

      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Header Section */}
        <header className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
            <span>🎯 Slingshot Physics</span>
            <span className="text-neutral-600">•</span>
            <span>Tailwind CSS</span>
            <span className="text-neutral-600">•</span>
            <span>React 18 & 19</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            react-throwable-slider
          </h1>
          <p className="text-neutral-400 max-w-xl text-sm sm:text-base leading-relaxed">
            A playful, physics-driven slider component. Drag along the track for precision, or pull down to slingshot the knob across the trajectory.
          </p>

          {/* Quick Install Commands */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => copyToClipboard('npx react-throwable-slider', 'npx')}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition text-xs font-mono text-neutral-300"
            >
              <span className="text-indigo-400 font-bold">$</span>
              <span>npx react-throwable-slider</span>
              <span className="text-neutral-500 group-hover:text-neutral-300 ml-1">
                {copiedCmd === 'npx' ? '✓ Copied!' : '📋'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard('npm i react-throwable-slider', 'npm')}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition text-xs font-mono text-neutral-300"
            >
              <span className="text-indigo-400 font-bold">$</span>
              <span>npm i react-throwable-slider</span>
              <span className="text-neutral-500 group-hover:text-neutral-300 ml-1">
                {copiedCmd === 'npm' ? '✓ Copied!' : '📋'}
              </span>
            </button>
          </div>
        </header>

        {/* Hero Interactive Playground */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm flex flex-col gap-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Interactive Slingshot Arena</h2>
              <p className="text-xs text-neutral-400">
                Click & drag knob horizontally to slide, or pull down to aim and release.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-mono">Status:</span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded capitalize ${
                  flightStatus === 'flying'
                    ? 'bg-rose-500/20 text-rose-300'
                    : flightStatus === 'aiming'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {flightStatus}
              </span>
            </div>
          </div>

          {/* Big Hero Slider */}
          <div className="py-8 px-4 bg-neutral-950/40 rounded-xl border border-neutral-800/40">
            <ThrowableSlider
              ref={heroSliderRef}
              label="Launch Power Gauge"
              unit="%"
              defaultValue={50}
              min={0}
              max={100}
              step={1}
              gravity={gravity}
              launchPower={launchPower}
              accentColor={accentColor}
              onInput={(val) => {
                setHeroValue(val);
                setFlightStatus('flying');
              }}
              onChange={(val) => {
                setHeroValue(val);
                setFlightStatus('idle');
              }}
            />
          </div>

          {/* Physics Tweak Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {/* Gravity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Gravity</span>
                <span className="font-mono text-indigo-400">{gravity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.02"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Launch Power */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Launch Power</span>
                <span className="font-mono text-indigo-400">{launchPower.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.01"
                value={launchPower}
                onChange={(e) => setLaunchPower(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Accent Color Presets */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-neutral-400">Accent Color</span>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setAccentColor(c.hex)}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: accentColor === c.hex ? '#ffffff' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Programmatic Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
            <span className="text-neutral-400 font-mono">
              Current Value: <strong className="text-white">{heroValue}%</strong>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => heroSliderRef.current?.reset()}
                className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition font-medium"
              >
                Reset via Ref
              </button>
            </div>
          </div>
        </section>

        {/* Preset Showcases Grid */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Example Presets</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Supports continuous floats, quantized steps, signed values (+/-), and controlled bindings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Preset 1: Audio Gain */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">Audio Gain Staging</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  signed: true
                </span>
              </div>
              <ThrowableSlider
                label="Master Gain"
                unit=" dB"
                min={-24}
                max={24}
                step={0.5}
                defaultValue={0}
                signed
                accentColor="#10b981"
              />
              <p className="text-[11px] text-neutral-500">
                Range from -24 dB to +24 dB with 0.5 step quantization.
              </p>
            </div>

            {/* Preset 2: Camera EV */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">Exposure Value (EV)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  step: 0.3
                </span>
              </div>
              <ThrowableSlider
                label="Exposure Compensation"
                unit=" EV"
                min={-3}
                max={3}
                step={0.3}
                defaultValue={0}
                signed
                accentColor="#f59e0b"
              />
              <p className="text-[11px] text-neutral-500">
                Fine 1/3-stop step intervals commonly used in camera sensors.
              </p>
            </div>

            {/* Preset 3: Dial Angle */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">Rotation Angle</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  step: 15°
                </span>
              </div>
              <ThrowableSlider
                label="Bearing / Heading"
                unit="°"
                min={0}
                max={360}
                step={15}
                defaultValue={90}
                accentColor="#06b6d4"
              />
              <p className="text-[11px] text-neutral-500">
                Discrete 15-degree increments with projectile throwing.
              </p>
            </div>

            {/* Preset 4: Controlled State */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">Controlled Two-Way Binding</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={controlledVal}
                  onChange={(e) => setControlledVal(Number(e.target.value))}
                  className="w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-right font-mono text-purple-300"
                />
              </div>
              <ThrowableSlider
                label="External Sync"
                unit="%"
                value={controlledVal}
                min={0}
                max={100}
                step={1}
                accentColor="#a855f7"
                onChange={(v) => setControlledVal(v)}
              />
              <p className="text-[11px] text-neutral-500">
                Synced with external React state and number input.
              </p>
            </div>
          </div>
        </section>

        {/* Code Snippet */}
        <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-200">How to use in your project</h2>
          <pre className="bg-neutral-950 p-4 rounded-lg text-xs font-mono text-neutral-300 overflow-x-auto border border-neutral-800/80">
{`import { ThrowableSlider } from '@/components/ui/ThrowableSlider';

export function Example() {
  return (
    <ThrowableSlider
      label="Master Volume"
      unit="%"
      defaultValue={75}
      min={0}
      max={100}
      step={1}
      accentColor="#6366f1"
      onChange={(val) => console.log('Final value:', val)}
    />
  );
}`}
          </pre>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-neutral-500 pb-8 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>MIT Licensed</span>
          <span className="hidden sm:inline text-neutral-700">•</span>
          <span>
            Created with ❤️ by{' '}
            <a
              href="https://pouyahadidi.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Pouya Hadidi
            </a>
          </span>
          <span className="hidden sm:inline text-neutral-700">•</span>
          <a
            href="mailto:contact@pouyahadidi.ir"
            className="text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            contact@pouyahadidi.ir
          </a>
        </footer>
      </div>
    </div>
  );
}
