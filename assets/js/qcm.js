// assets/js/qcm.js
import { sampleWithReplacement, arraysEqual } from './utils.js';
import { loadAllThemes, getThemeBank } from './data.js';

let QUESTIONS = [], idx = 0, score = 0;

function refs(){
  return {
    elQuestion: document.getElementById('question'),
    elChoices: document.getElementById('choices'),
    elValidate: document.getElementById('validate'),
    elNext: document.getElementById('next'),
    elBar: document.getElementById('bar'),
    elChipIdx: document.getElementById('chipIndex'),
    elChipTheme: document.getElementById('chipTheme'),
    elChipCourse: document.getElementById('chipCourse'),
    elChipChapter: document.getElementById('chipChapter'),
    elFeedback: document.getElementById('feedback'),
    elFbIcon: document.getElementById('fb-icon'),
    elFbTitle: document.getElementById('fb-title'),
    elFbAnswers: document.getElementById('fb-answers'),
    elResult: document.getElementById('result'),
    elResText: document.getElementById('res-text'),
  };
}

function getSelected(){
  const arr = [];
  document.querySelectorAll('.choice input:checked').forEach(inp => {
    const i = parseInt(inp.closest('.choice').dataset.index, 10);
    arr.push(i);
  });
  return arr.sort((a,b)=>a-b);
}

export function renderQuestion(){
  const r = refs(); if(!r.elQuestion) return;
  const q = QUESTIONS[idx];
  r.elQuestion.textContent = q?.text || '—';
  r.elChoices.innerHTML = '';

  (q.choices || []).forEach((label, i) => {
    const item = document.createElement('label');
    item.className = 'choice';
    item.dataset.index = i;
    item.dataset.type = 'multi'; // multi-choix

    // --- construction DOM explicite (checkbox + span) ---
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = `choice_${idx}_${i}`;

    const span = document.createElement('span');
    span.textContent = label;

    // la classe .selected suit l'état checked
    input.addEventListener('change', () => {
      item.classList.toggle('selected', input.checked);
    });

    item.appendChild(input);
    item.appendChild(span);
    // -----------------------------------------------------

    r.elChoices.appendChild(item);
  });

  r.elChipIdx.textContent = `${idx+1} / ${QUESTIONS.length}`;
  r.elBar.style.width = `${(idx)/QUESTIONS.length*100}%`;
  r.elChipTheme.textContent = `Thème: ${q.theme || '—'}`;
  r.elChipCourse.textContent = `GTO: ${q.course || '—'}`;
  r.elChipChapter.textContent = `Chapitre: ${q.chapter || '—'}`;
  r.elValidate.disabled = false;
  r.elNext.disabled = true;
  r.elFeedback.style.display = 'none';
  r.elResult.style.display = 'none';
}

export async function startRandomSession(filters = {}){
  const bank = await loadAllThemes();
  let pool = []; for(const k of Object.keys(bank)) pool = pool.concat(bank[k].questions);
  if(filters.theme){ pool = pool.filter(q=> q.theme === filters.theme); }
  if(filters.course){ pool = pool.filter(q=> q.course === filters.course); }
  if(filters.chapter){ pool = pool.filter(q=> q.chapter === filters.chapter); }
  if(pool.length === 0){ alert('Aucune question trouvée avec ces filtres. Essayez un autre GTO/chapitre.'); return; }
  QUESTIONS = sampleWithReplacement(pool, 20);
  idx=0; score=0;
  renderQuestion();
  const r = refs();
  r.elChipIdx.textContent = `1 / ${QUESTIONS.length}`;
  if (location.hash !== '#qcm') location.hash = '#qcm';
}

export function bindQCMControls(){
  const r = refs(); if(!r.elValidate || !r.elNext) return;
  r.elValidate.addEventListener('click', () => {
    const q = QUESTIONS[idx]; const bank = getThemeBank();
    const sel = getSelected();

    // si aucune réponse → compter comme FAUX (pas d’alerte)
    if(!sel.length){
      const ans = (bank[q.theme]?.answers?.[q.id] || {});
      r.elFbIcon.className = 'icon ko';
      r.elFeedback.className = 'feedback ko';
      r.elFbTitle.textContent = 'Mauvaise réponse';
      r.elFbAnswers.innerHTML='';
      (q.choices || []).forEach((label, i) => {
        const p = document.createElement('div');
        const isOk = (ans.correct || []).includes(i);
        p.className = 'ans ' + (isOk ? 'ok' : '');
        p.innerHTML = `${isOk ? '✅' : '•'} ${label}`;
        r.elFbAnswers.appendChild(p);
      });
      r.elFeedback.style.display = 'block';
      r.elValidate.disabled = true;
      r.elNext.disabled = false;
      return;
    }

    // correction multi-choix (égalité d’ensembles exacte)
    const ans = (bank[q.theme]?.answers?.[q.id] || {});
    const ok = arraysEqual(sel, (ans.correct || []));
    if(ok) score++;

    r.elFbIcon.className = 'icon ' + (ok ? 'ok' : 'ko');
    r.elFeedback.className = 'feedback ' + (ok ? 'ok' : 'ko');
    r.elFbTitle.textContent = ok ? 'Bonne réponse' : 'Mauvaise réponse';
    r.elFbAnswers.innerHTML='';
    (q.choices || []).forEach((label, i) => {
      const p = document.createElement('div');
      const isOk = (ans.correct || []).includes(i);
      const wasPicked = sel.includes(i);
      p.className = 'ans ' + (isOk ? 'ok' : (wasPicked ? 'ko' : ''));
      p.innerHTML = `${isOk ? '✅' : (wasPicked ? '❌' : '•')} ${label}`;
      r.elFbAnswers.appendChild(p);
    });
    r.elFeedback.style.display = 'block';
    r.elValidate.disabled = true;
    r.elNext.disabled = false;
    if(idx === QUESTIONS.length-1){ r.elBar.style.width = '100%'; }
  });

  r.elNext.addEventListener('click', () => {
    if(idx < QUESTIONS.length-1){ idx++; renderQuestion(); }
    else {
      const total = QUESTIONS.length;
      const percent = Math.round(score / total * 100);
      const note20 = Math.round((score / total * 20) * 100) / 100;
      r.elResText.textContent = `Score : ${score}/${total} (${percent} %). Note sur 20 : ${note20}/20.`;
      document.getElementById('res-title').textContent = percent >= 70 ? 'Bravo !' : 'Session terminée';
      r.elResult.style.display = 'block';
      window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
    }
  });
}

export function hasQuestions(){ try { return Array.isArray(QUESTIONS) && QUESTIONS.length > 0; } catch(e){ return false; } }
