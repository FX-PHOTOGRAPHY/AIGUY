'use client';

import { useEffect, useRef, useState } from 'react';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

type Source = 'microphone' | 'impulse' | 'tone' | 'chirp' | 'noise';

function drawScope(canvas: HTMLCanvasElement, data: Float32Array, spectrum: Float32Array, sampleRate: number) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#050b10'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#18313d'; ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) { const y = h * i / 5; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x=0; x<w; x++) { const i=Math.min(data.length-1, Math.floor(x/w*data.length)); const y=h*.27-data[i]*h*.22; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke();
  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.beginPath();
  const nyquist=sampleRate/2;
  for(let x=0;x<w;x++){ const f=20*Math.pow(1000, x/w); const bin=Math.min(spectrum.length-1,Math.floor(f/nyquist*spectrum.length)); const y=h*.98-spectrum[bin]*h*.55; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke();
  ctx.fillStyle='#64748b'; ctx.font=`${11*dpr}px ui-monospace`; ctx.fillText('TIME / AMPLITUDE',12,18*dpr); ctx.fillText('SPECTRUM · 20 Hz — 20 kHz',12, h-10*dpr);
}

function makeBuffer(ctx: AudioContext, kind: Exclude<Source,'microphone'>, freq: number, duration: number) {
  const n=Math.floor(ctx.sampleRate*duration), b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++){ const t=i/ctx.sampleRate, env=Math.exp(-t*7); if(kind==='impulse') d[i]=(i<Math.max(1,ctx.sampleRate*.001)?(1-i/(ctx.sampleRate*.001)):0)*.8; else if(kind==='tone') d[i]=Math.sin(2*Math.PI*freq*t)*.28; else if(kind==='chirp'){ const f0=20, f1=20000; const k=(f1-f0)/duration; d[i]=Math.sin(2*Math.PI*(f0*t+.5*k*t*t))*.28*env; } else d[i]=(Math.random()*2-1)*.2*env; }
  return b;
}

export default function Home(){
  const canvasRef=useRef<HTMLCanvasElement>(null); const audioRef=useRef<AudioContext|null>(null); const analyserRef=useRef<AnalyserNode|null>(null); const streamRef=useRef<MediaStream|null>(null); const sourceNodeRef=useRef<AudioNode|null>(null); const rafRef=useRef<number|null>(null);
  const [source,setSource]=useState<Source>('microphone'); const [running,setRunning]=useState(false); const [playing,setPlaying]=useState(false); const [threshold,setThreshold]=useState(.62); const [gain,setGain]=useState(.18); const [tone,setTone]=useState(1000); const [peak,setPeak]=useState(0); const [centroid,setCentroid]=useState(0); const [confidence,setConfidence]=useState(0); const [status,setStatus]=useState('Ready — local laboratory mode.');
  useEffect(()=>()=>stopAll(),[]);
  function stopAll(){ if(rafRef.current)cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t=>t.stop()); try{sourceNodeRef.current?.disconnect()}catch{} sourceNodeRef.current=null; setRunning(false);setPlaying(false); }
  function analyse(){ const a=analyserRef.current,c=canvasRef.current;if(!a||!c)return; const td=new Float32Array(a.fftSize),fd=new Float32Array(a.frequencyBinCount);a.getFloatTimeDomainData(td);a.getFloatFrequencyData(fd);let p=0,weighted=0,total=0;for(const v of td)p=Math.max(p,Math.abs(v));for(let i=1;i<fd.length;i++){const mag=Math.pow(10,fd[i]/20);total+=mag;weighted+=mag*i*(a.context.sampleRate/2/a.frequencyBinCount)}const sc=clamp(p*2.8,0,1);setPeak(p);setConfidence(sc);setCentroid(total?weighted/total:0);drawScope(c,td,fd,a.context.sampleRate);rafRef.current=requestAnimationFrame(analyse); }
  async function ensureAudio(){ if(!audioRef.current){const AC=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;audioRef.current=new AC();}await audioRef.current.resume();const a=audioRef.current.createAnalyser();a.fftSize=4096;a.smoothingTimeConstant=.08;analyserRef.current=a;return audioRef.current; }
  async function start(){try{const audio=await ensureAudio();stopAll();analyserRef.current=audio.createAnalyser();analyserRef.current.fftSize=4096;analyserRef.current.smoothingTimeConstant=.08;const a=analyserRef.current;if(source==='microphone'){const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});streamRef.current=s;audio.createMediaStreamSource(s).connect(a);setStatus('Microphone analysis active. Audio stays in this browser.');setRunning(true);analyse();}else{playSynthetic(audio);}}catch{setStatus('Audio unavailable or microphone permission was denied.');}}
  function playSynthetic(audio=audioRef.current!){const b=makeBuffer(audio,source as Exclude<Source,'microphone'>,tone,source==='chirp'?3:1.5),buf=audio.createBufferSource(),g=audio.createGain();g.gain.value=gain;buf.buffer=b;buf.connect(g).connect(analyserRef.current!);buf.connect(audio.destination);sourceNodeRef.current=buf;buf.onended=()=>{setPlaying(false);setRunning(false)};buf.start();setPlaying(true);setRunning(true);setStatus('Synthetic playback active — output is controlled locally.');analyse();}
  const detector=confidence>=threshold?'SIGNATURE-LIKE':'BACKGROUND / BELOW THRESHOLD';
  return <main className='shell'><section className='hero'><div><p className='eyebrow'>ACOUSTIC LAB · ALPHA</p><h1>Sound as signal.</h1><p className='lede'>A rigorous local laboratory for studying how acoustic waveforms become sensor measurements.</p></div><div className='pill'>SAFE LAB MODE</div></section>
  <section className='grid'><article className='panel wide'><div className='panelHead'><div><span className='label'>LIVE SCOPE</span><h2>{detector}</h2></div><span className='mono'>{(confidence*100).toFixed(0)}%</span></div><canvas ref={canvasRef} className='scope'/><div className='metrics'><div><span>PEAK</span><strong>{peak.toFixed(3)}</strong></div><div><span>SPECTRAL CENTROID</span><strong>{centroid?`${Math.round(centroid)} Hz`:'—'}</strong></div><div><span>ANALYSIS</span><strong>20 Hz — 20 kHz</strong></div></div></article>
  <article className='panel'><span className='label'>SOURCE</span><h3>Laboratory input</h3><div className='seg'>{(['microphone','impulse','tone','chirp','noise'] as Source[]).map(s=><button key={s} className={source===s?'active':''} onClick={()=>{if(!running)setSource(s)}} disabled={running}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div><label>Detector threshold <input type='range' min='.1' max='.95' step='.01' value={threshold} onChange={e=>setThreshold(+e.target.value)}/><b>{threshold.toFixed(2)}</b></label>{source==='tone'&&<label>Test frequency <input type='range' min='20' max='20000' step='10' value={tone} onChange={e=>setTone(+e.target.value)}/><b>{tone.toLocaleString()} Hz</b></label>}{source!=='microphone'&&<label>Playback gain <input type='range' min='0' max='.5' step='.01' value={gain} onChange={e=>setGain(+e.target.value)}/><b>{gain.toFixed(2)}</b></label>}<div className='actions'><button className='primary' onClick={running?stopAll:start}>{running?(playing?'Stop playback':'Stop analysis'):(source==='microphone'?'Start analysis':'Play & analyse')}</button></div><p className='status'>{status}</p></article>
  <article className='panel'><span className='label'>SPECTRUM</span><h3>Why 20 Hz — 20 kHz?</h3><p>The Alpha deliberately visualises the conventional human-audible band. Flock does not publicly specify a proprietary microphone frequency response, so this is a research range—not a claim about Flock hardware.</p><div className='note'>For controlled research, compare signals by waveform, spectral distribution, transient shape and robustness to noise/reverberation rather than amplitude alone.</div></article>
  <article className='panel wide'><span className='label'>PIPELINE</span><div className='pipeline'><span>ACOUSTIC INPUT</span><i>→</i><span>SENSOR MODEL</span><i>→</i><span>FFT / FEATURES</span><i>→</i><span>DETECTOR</span><i>→</i><span>CONFIDENCE</span></div></article></section></main>;
}
