// assets/js/utils.js
export const pad2 = (n)=> String(n).padStart(2,'0');
export function formatHMS(totalSeconds){
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}
export function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
export function sampleWithReplacement(arr, n){ const out=[]; if(arr.length===0) return out; while(out.length<n){ out.push(arr[out.length%arr.length]); } return shuffle(out).slice(0,n); }
export function uniqValues(arr){ return Array.from(new Set(arr)); }
export function arraysEqual(a,b){ return a.length===b.length && a.every((v,i)=>v===b[i]); }
