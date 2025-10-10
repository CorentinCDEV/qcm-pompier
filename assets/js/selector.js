// assets/js/selector.js
import { loadTheme, loadAllThemes } from './data.js';
import { startConcours } from './concours.js';
import { startRandomSession } from './qcm.js';

const selModal = document.getElementById('selector-modal');
const selClose = document.getElementById('sel-close');
const selTheme = document.getElementById('sel-theme');
const selCourse = document.getElementById('sel-course');
const selChapter = document.getElementById('sel-chapter');
const selStartQcm = document.getElementById('sel-start-qcm');
const selStartConcours = document.getElementById('sel-start-concours');

export function initSelector(){
  if(!(selModal && selClose && selCourse && selChapter)) return;
  selClose.addEventListener('click', ()=> selModal.style.display='none');
  selModal.addEventListener('click', (e)=>{ if(e.target === selModal) selModal.style.display='none'; });
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      e.preventDefault();
      await openSelector(card.getAttribute('data-theme'));
    });
  });
  selStartQcm?.addEventListener('click', startQcmFromSelector);
  selStartConcours?.addEventListener('click', startConcoursFromSelector);
}

async function openSelector(themeKey){
  const bank = await loadTheme(themeKey);
  selTheme.textContent = `Thème : ${themeKey}`;
  const courses = Array.from(new Set(bank.questions.map(q=>q.course))).sort();
  selCourse.innerHTML = `<option value="">Tous les GTO</option>` + courses.map(c=>`<option value="${c}">${c}</option>`).join('');
  const chapters = Array.from(new Set(bank.questions.map(q=>q.chapter))).sort();
  selChapter.innerHTML = `<option value="">Tous les chapitres</option>` + chapters.map(ch=>`<option value="${ch}">${ch}</option>`).join('');
  selCourse.onchange = () => {
    const c = selCourse.value;
    const chs = Array.from(new Set(bank.questions.filter(q=>!c || q.course===c).map(q=>q.chapter))).sort();
    selChapter.innerHTML = `<option value="">Tous les chapitres</option>` + chs.map(x=>`<option value="${x}">${x}</option>`).join('');
  };
  selModal.dataset.theme = themeKey;
  selModal.style.display = 'flex';
}

async function startQcmFromSelector(){
  const theme = selModal.dataset.theme;
  const filters = { theme };
  if(selCourse.value) filters.course = selCourse.value;
  if(selChapter.value) filters.chapter = selChapter.value;
  selModal.style.display = 'none';
  await startRandomSession(filters);
}

async function startConcoursFromSelector(){
  const theme = selModal.dataset.theme;
  const filters = { theme };
  if(selCourse.value) filters.course = selCourse.value;
  if(selChapter.value) filters.chapter = selChapter.value;
  selModal.style.display='none';
  await startConcours(filters);
}
