'use client';

import { useEffect, useRef, useState } from 'react';

type Source = 'microphone' | 'impulse' | 'tone' | 'chirp' | 'noise' | 'sweep';
const clamp = (n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const fmtHz=(n:number)=>n>=1000?`${(n/1000).toFixed(n>=10000?0:1)} kHz`:`${Math.round(n)} Hz`;

function draw(canvas:HTMLCanvasElement,time:Float32Array,freq:Float32Array,sr:number){
 const ctx=canvas.getContext('2d'); if(!ctx)return; const dpr=devicePixelRatio||1,w=canvas.clientWidth*dpr,h=canvas.clientHeight*dpr;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h} ctx.clearRect(0,0,w,h);ctx.fillStyle='#050b10';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#16303c';ctx.lineWidth=1; for(let i=1;i<5;i++){const y=h*i/5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.strokeStyle='#67e8f9';ctx.lineWidth=2;ctx.beginPath(); for(let x=0;x<w;x++){const i=Math.min(time.length-1,Math.floor(x/w*time.length));const y=h*.25-time[i]*h*.2;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 ctx.strokeStyle='#a78bfa';ctx.beginPath();const ny=sr/2;for(let x=0;x<w;x++){const f=20*Math.pow(1000,x/(w-1));const bin=Math.min(freq.length-1,Math.max(1,Math.floor(f/ny*freq.length)));const mag=clamp((freq[bin]+100)/100,0,1);const y=h*.96-mag*h*.52;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
 ctx.fillStyle='#64748b';ctx.font=`${11*dpr}px ui-monospace`;ctx.fillText('WAVEFORM',12,18*dpr);ctx.fillText('LOG SPECTRUM · 20 Hz — 20 kHz',12,h-10*dpr);
}

function synth(ctx:AudioContext,kind:Source,freq:number,dur:number){
 const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++){const t=i/ctx.sampleRate,env=Math.exp(-t*5),r=Math.random()*2-1;let v=0;
  if(kind==='impulse')v=i<ctx.sampleRate*.001?.8*(1-i/(ctx.sampleRate*.001)):0;
  else if(kind==='tone')v=Math.sin(2*Math.PI*freq*t)*.28;
  else if(kind==='chirp'){const f0=20,f1=20000,k=(f1-f0)/dur;v=Math.sin(2*Math.PI*(f0*t+.5*k*t*t))*.25*env}
  else if(kind==='sweep'){const f0=20,f1=20000,k=Math.log(f1/f0)/dur;v=Math.sin(2*Math.PI*f0*(Math.exp(k*t)-1)/k)*.25*env}
  else v=r*.2*env; d[i]=v;
 } return b;
}

export default function Home(){
 const canvas=useRef<HTMLCanvasElement>(null),audio=useRef<AudioContext|null>(null),an=useRef<AnalyserNode|null>(null),stream=useRef<MediaStream|null>(null),node=useRef<AudioNode|null>(null),raf=useRef<number|null>(null);
 const [source,setSource]=useState<Source>('microphone'),[running,setRunning]=useState(false),[threshold,setThreshold]=useState(.62),[gain,setGain]=useState(.15),[tone,setTone]=useState(1000),[peak,setPeak]=useState(0),[rms,setRms]=useState(0),[centroid,setCentroid]=useState(0),[status,setStatus]=useState('Ready — local laboratory mode.');
 useEffect(()=>()=>cleanup(),[]);
 function cleanup(){if(raf.current)cancelAnimationFrame(raf.current);stream.current?.getTracks().forEach(t=>t.stop());try{node.current?.disconnect()}catch{}node.current=null;setRunning(false)}
 async function ensure(){if(!audio.current){const C=window.AudioContext||(window as typeof window&{webkitAudioContext:typeof AudioContext}).webkitAudioContext;audio.current=new C()}await audio.current.resume();return audio.current}
 function loop(){const a=an.current,c=canvas.current;if(!a||!c)return;const td=new Float32Array(a.fftSize),fd=new Float32Array(a.frequencyBinCount);a.getFloatTimeDomainData(td);a.getFloatFrequencyData(fd);let p=0,e=0,wt=0,total=0;for(const v of td){p=Math.max(p,Math.abs(v));e+=v*v}for(let i=1;i<fd.length;i++){const m=Math.pow(10,fd[i]/20),f=i*a.context.sampleRate/(2*fd.length);total+=m;wt+=m*f}setPeak(p);setRms(Math.sqrt(e/td.length));const cf=total?wt/total:0;setCentroid(cf);draw(c,td,fd,a.context.sampleRate);raf.current=requestAnimationFrame(loop)}
 async function start(){try{cleanup();const C=await ensure(),a=C.createAnalyser();a.fftSize=4096;a.smoothingTimeConstant=.06;an.current=a;if(source==='microphone'){const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});stream.current=s;C.createMediaStreamSource(s).connect(a);setStatus('Microphone analysis active. Processing stays in this browser.');setRunning(true);loop();return}const b=synth(C,source,tone,source==='chirp'||source==='sweep'?4:2),bs=C.createBufferSource(),g=C.createGain();g.gain.value=gain;bs.buffer=b;bs.connect(g).connect(a);g.connect(C.destination);node.current=bs;bs.onended=()=>{setRunning(false);setStatus('Playback complete. Results remain local to this session.')};bs.start();setStatus('Synthetic playback + analysis active.');setRunning(true);loop()}catch{setStatus('Audio unavailable or microphone permission was denied.')}}
 const conf=clamp((peak*.9+rms*2.2)*.5,0,1),state=conf>=threshold?'SIGNATURE-LIKE':'BACKGROUND / BELOW THRESHOLD';
 return <main className='shell'><section className='hero'><div><p className='eyebrow'>ACOUSTIC LAB · ALPHA 1.1</p><h1>Sound as signal.</h1><p className='lede'>A local, instrument-style laboratory for studying acoustic waveforms, frequency content and detector behaviour.</p></div><div className='pill'>SAFE LAB MODE</div></section><section className='grid'>
 <article className='panel wide'><div className='panelHead'><div><span className='label'>LIVE ANALYSIS</span><h2>{state}</h2></div><span className='mono'>{(conf*100).toFixed(0)}%</span></div><canvas ref={canvas} className='scope'/><div className='metrics'><div><span>PEAK</span><strong>{peak.toFixed(3)}</strong></div><div><span>RMS</span><strong>{rms.toFixed(3)}</strong></div><div><span>CENTROID</span><strong>{centroid?fmtHz(centroid):'—'}</strong></div></div></article>
 <article className='panel'><span className='label'>SIGNAL SOURCE</span><h3>Laboratory input</h3><div className='seg'>{(['microphone','impulse','tone','chirp','noise','sweep'] as Source[]).map(s=><button key={s} className={source===s?'active':''} onClick={()=>!running&&setSource(s)} disabled={running}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div>{source==='tone'&&<label>Frequency<input type='range' min='20' max='20000' step='10' value={tone} onChange={e=>setTone(+e.target.value)}/><b>{tone.toLocaleString()} Hz</b></label>}{source!=='microphone'&&<label>Playback gain<input type='range' min='0' max='.5' step='.01' value={gain} onChange={e=>setGain(+e.target.value)}/><b>{gain.toFixed(2)}</b></label>}<label>Detector threshold<input type='range' min='.05' max='.95' step='.01' value={threshold} onChange={e=>setThreshold(+e.target.value)}/><b>{threshold.toFixed(2)}</b></label><div className='actions'><button className='primary' onClick={running?cleanup:start}>{running?(source==='microphone'?'Stop analysis':'Stop playback'):(source==='microphone'?'Start analysis':'Play & analyse')}</button></div><p className='status'>{status}</p></article>
 <article className='panel'><span className='label'>FREQUENCY LAB</span><h3>20 Hz → 20 kHz</h3><p>Wide conventional audible-band analysis. This is a research range, not a claim about Flock's proprietary microphone response.</p><div className='band'><span>20 Hz</span><span>100 Hz</span><span>1 kHz</span><span>10 kHz</span><span>20 kHz</span></div><div className='note'>Use low playback levels. Synthetic signals are generated locally and the app does not connect to deployed surveillance hardware.</div></article>
 <article className='panel'><span className='label'>MEASUREMENT</span><h3>What the detector sees</h3><p>Alpha 1.1 separates measurable quantities from classification. Waveform, RMS energy, peak amplitude and spectral centroid are displayed independently.</p><div className='note'>Next layer: calibrated windowing, spectral flux, band-energy ratios, transient descriptors, saved experiments and ROC-style evaluation on labelled test audio.</div></article>
 <article className='panel wide'><span className='label'>PIPELINE</span><div className='pipeline'><span>INPUT</span><i>→</i><span>WINDOW</span><i>→</i><span>FFT</span><i>→</i><span>FEATURES</span><i>→</i><span>THRESHOLD</span><i>→</i><span>RESULT</span></div></article>
 </section></main>
}