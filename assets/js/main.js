// assets/js/main.js
import { initNav } from './nav.js';
import { startConcours, bindConcoursControls } from './concours.js';
import { startRandomSession, bindQCMControls, hasQuestions } from './qcm.js';
import { initSelector } from './selector.js';
import { initCatalog } from './catalog.js';

function showSection(hash){
  const a = document.getElementById('accueil-sec');
  if(!a) return; // not on index
  const t = document.getElementById('themes-sec');
  const q = document.getElementById('qcm-sec');
  const c = document.getElementById('concours-sec');
  a.style.display = t.style.display = 'block';
  q.style.display = c.style.display = 'none';
  if(hash === '#qcm'){ a.style.display = t.style.display = 'none'; q.style.display = 'block'; }
  if(hash === '#concours'){ a.style.display = t.style.display = 'none'; c.style.display = 'block'; }
  if(hash === '#themes'){ a.style.display = 'none'; }
}

function ensureQcmStartedDefault(){
  try{
    if (location.hash !== '#qcm') return;
    const ok = (typeof hasQuestions === 'function') ? hasQuestions() : false;
    if(!ok){
      startRandomSession({});
    }
  }catch(e){
    console.error('[QCM] Auto-start failed', e);
  }
}

window.addEventListener('hashchange', () => { showSection(location.hash); ensureQcmStartedDefault(); });

document.addEventListener('DOMContentLoaded', () => {
  // Init modules
  initNav();
  initSelector();
  initCatalog();

  // Global delegation for start buttons
  document.addEventListener('click', (e) => {
    const btnRandom = e.target.closest('[data-start-random]');
    if(btnRandom){
      e.preventDefault();
      startRandomSession({});
      return;
    }
    const btnConcours = e.target.closest('[data-start-concours]');
    if(btnConcours){
      e.preventDefault();
      startConcours({});
      return;
    }
  });

  // Bind controls
  bindQCMControls();
  bindConcoursControls();

  // If returning from themes with filters
  const filtersStr = window.localStorage.getItem('qcm_filters');
  if(filtersStr && location.hash === '#qcm'){
    try{
      const filters = JSON.parse(filtersStr);
      window.localStorage.removeItem('qcm_filters');
      startRandomSession(filters);
    }catch(e){ /* ignore */ }
  }
  showSection(location.hash || '#accueil');
  ensureQcmStartedDefault();
});
