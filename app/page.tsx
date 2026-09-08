'use client';

import { useEffect, useRef, useState } from 'react';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function drawWave(canvas: HTMLCanvasElement, data: Float32Array | number[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; ctx.beginPath();
  const step = Math.max(1, Math.floor(data.length / w));
  for (let x = 0; x < w; x++) {
    const i = Math.min(data.length - 1, x * step);
    const y = h / 2 - data[i] * h * 0.42;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState<'microphone' | 'synthetic'>('microphone');
  const [threshold, setThreshold] = useState(0.62);
  const [confidence, setConfidence] = useState(0);
  const [peak, setPeak] = useState(0);
  const [status, setStatus] = useState('Ready for a local, non-networked test.');

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const renderLoop = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let p = 0; for (const v of data) p = Math.max(p, Math.abs(v));
    setPeak(p);
    const transientScore = clamp(p * 2.8, 0, 1);
    setConfidence(transientScore);
    drawWave(canvas, data);
    rafRef.current = requestAnimationFrame(renderLoop);
  };

  const start = async () => {
    try {
      const AC = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audio = new AC();
      const analyser = audio.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      analyserRef.current = analyser;
      if (source === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        audio.createMediaStreamSource(stream).connect(analyser);
        setStatus('Microphone analysis active — audio stays in this browser.');
      } else {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        gain.gain.value = 0.0;
        osc.frequency.value = 180;
        osc.connect(gain).connect(analyser);
        osc.start();
        setStatus('Synthetic source active — no external signal is transmitted.');
      }
      setRunning(true);
      renderLoop();
    } catch {
      setStatus('Microphone unavailable or permission was denied.');
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setRunning(false); setConfidence(0); setPeak(0); setStatus('Stopped.');
  };

  const detectorState = confidence >= threshold ? 'SIGNATURE-LIKE' : 'BACKGROUND / BELOW THRESHOLD';

  return (
    <main className='shell'>
      <section className='hero'>
        <div><p className='eyebrow'>ACOUSTIC LAB · ALPHA</p><h1>Sound as signal.</h1><p className='lede'>A local laboratory for exploring how acoustic signatures become measurable sensor data.</p></div>
        <div className='pill'>SAFE LAB MODE</div>
      </section>

      <section className='grid'>
        <article className='panel wide'><div className='panelHead'><div><span className='label'>LIVE WAVEFORM</span><h2>{detectorState}</h2></div><span className='mono'>{(confidence * 100).toFixed(0)}%</span></div><canvas ref={canvasRef} className='scope' /><div className='metrics'><div><span>PEAK</span><strong>{peak.toFixed(3)}</strong></div><div><span>THRESHOLD</span><strong>{threshold.toFixed(2)}</strong></div><div><span>MODE</span><strong>LOCAL</strong></div></div></article>

        <article className='panel'><span className='label'>CONTROL</span><h3>Input source</h3><div className='seg'><button className={source==='microphone'?'active':''} onClick={()=>setSource('microphone')} disabled={running}>Microphone</button><button className={source==='synthetic'?'active':''} onClick={()=>setSource('synthetic')} disabled={running}>Synthetic</button></div><label>Detector threshold <input type='range' min='0.1' max='0.95' step='0.01' value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/><b>{threshold.toFixed(2)}</b></label><div className='actions'><button className='primary' onClick={running?stop:start}>{running?'Stop':'Start analysis'}</button></div><p className='status'>{status}</p></article>

        <article className='panel'><span className='label'>MODEL NOTE</span><h3>What this Alpha demonstrates</h3><p>This prototype uses a deliberately simple amplitude/transient score. It is not a gunshot classifier and is not intended to interact with deployed surveillance systems.</p><div className='note'>Next research layer: spectral features, onset detection, band-energy ratios, controlled perturbations, and ROC-style evaluation against labelled test audio.</div></article>

        <article className='panel wide'><span className='label'>PIPELINE</span><div className='pipeline'><span>ACOUSTIC INPUT</span><i>→</i><span>SENSOR</span><i>→</i><span>FEATURES</span><i>→</i><span>DETECTOR</span><i>→</i><span>CONFIDENCE</span></div></article>
      </section>
    </main>
  );
}
