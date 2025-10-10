// assets/js/catalog.js
import { loadAllThemes } from './data.js';
import { uniqValues } from './utils.js';
import { startConcours } from './concours.js';

export async function initCatalog(){
  const container = document.getElementById('catalog');
  if(!container) return;
  const bank = await loadAllThemes();

  // Build accordion per theme -> GTO -> chapters
  container.innerHTML = '';
  Object.keys(bank).forEach(themeKey => {
    const { questions } = bank[themeKey];
    const courses = uniqValues(questions.map(q=>q.course)).sort();
    const section = document.createElement('section');
    section.className = 'card';
    section.innerHTML = `<h2>${themeKey}</h2>`;
    courses.forEach(course => {
      const wrap = document.createElement('div');
      wrap.className = 'catalog-course';
      const chapters = uniqValues(questions.filter(q=>q.course===course).map(q=>q.chapter)).sort();
      const chHtml = chapters.map(ch => `
        <div class="catalog-chapter">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div><strong>${ch}</strong></div>
            <div class="row">
              <button class="btn btn-primary" data-action="qcm" data-theme="${themeKey}" data-course="${course}" data-chapter="${ch}">QCM (20)</button>
              <button class="btn" data-action="concours" data-theme="${themeKey}" data-course="${course}" data-chapter="${ch}">Concours</button>
            </div>
          </div>
        </div>
      `).join('');
      wrap.innerHTML = `
        <details class="catalog-acc">
          <summary><strong>${course}</strong></summary>
          <div class="catalog-list">${chHtml}</div>
        </details>
      `;
      section.appendChild(wrap);
    });
    container.appendChild(section);
  });

  // Actions
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const theme = btn.dataset.theme;
    const course = btn.dataset.course;
    const chapter = btn.dataset.chapter;
    const filters = { theme, course, chapter };
    if(btn.dataset.action === 'concours'){
      await startConcours(filters);
      window.location.href = 'index.html#concours';
    } else {
      // Fire event to open index QCM
      window.localStorage.setItem('qcm_filters', JSON.stringify(filters));
      window.location.href = 'index.html#qcm';
    }
  });
}
