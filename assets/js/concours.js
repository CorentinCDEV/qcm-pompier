// assets/js/concours.js
import { formatHMS, sampleWithReplacement } from './utils.js';
import { loadAllThemes, getThemeBank } from './data.js';
import { NOMINAL_TOTAL, TOTAL_QUESTIONS, DURATION_SECONDS } from './config.js';

let C_QUESTIONS = [], C_selected = {}, countdownInterval = null, countdownEndTs = 0;

function refs(){
  return {
    ccTitle: document.getElementById('cc-title'),
    ccTimer: document.getElementById('cc-timer'),
    ccList: document.getElementById('concours-list'),
    ccCount: document.getElementById('cc-chipCount'),
    ccRes: document.getElementById('cc-result'),
    ccResText: document.getElementById('cc-res-text'),
    ccBtnValidate: document.getElementById('cc-validate'),
  };
}

function startCountdown(seconds){
  stopCountdown();
  countdownEndTs = Date.now() + seconds*1000;
  updateTimer();
  countdownInterval = setInterval(updateTimer, 200);
}
function stopCountdown(){ if(countdownInterval){ clearInterval(countdownInterval); countdownInterval = null; } }
function updateTimer(){
  const { ccTimer } = refs();
  if(!ccTimer) return;
  const left = Math.max(0, Math.ceil((countdownEndTs - Date.now())/1000));
  ccTimer.textContent = formatHMS(left);
  if(left <= 0){ stopCountdown(); alert('⏰ Temps écoulé : l’épreuve est terminée.'); validateConcours(); }
}

export async function startConcours(filters = {}){
  const bank = await loadAllThemes();
  let pool = []; for(const k of Object.keys(bank)) pool = pool.concat(bank[k].questions);
  if(filters.theme){ pool = pool.filter(q=> q.theme === filters.theme); }
  if(filters.course){ pool = pool.filter(q=> q.course === filters.course); }
  if(filters.chapter){ pool = pool.filter(q=> q.chapter === filters.chapter); }
  if(pool.length === 0){ alert('Aucune question trouvée avec ces filtres. Essayez un autre GTO/chapitre.'); return; }
  C_QUESTIONS = sampleWithReplacement(pool, TOTAL_QUESTIONS);
  C_selected = {};
  renderConcoursList();
  const r = refs();
  if(r.ccRes) r.ccRes.style.display = 'none';
  if(r.ccTitle) r.ccTitle.textContent = `Mode concours — ${NOMINAL_TOTAL} questions`;
  if(r.ccCount) r.ccCount.textContent = `0 / ${TOTAL_QUESTIONS} répondues`;
  startCountdown(DURATION_SECONDS);
  if (location.hash !== '#concours') location.hash = '#concours';
}

function renderConcoursList(){
  const r = refs(); if(!r.ccList) return;
  r.ccList.innerHTML = '';
  C_QUESTIONS.forEach((q, qIdx) => {
    const card = document.createElement('div');
    card.className = 'qitem';
    const head = document.createElement('div');
    head.className = 'qhead';
    const title = document.createElement('div');
    title.innerHTML = `<strong>Q${qIdx+1}.</strong> ${q.text}`;
    head.appendChild(title);
    card.appendChild(head);
    const choices = document.createElement('div');
    choices.className = 'choices';
    (q.choices || []).forEach((label, i) => {
      const lab = document.createElement('label');
      lab.className = 'choice';
      lab.dataset.index = i;
      lab.dataset.qidx = qIdx;
      lab.innerHTML = `<input type="radio" name="q_${qIdx}"><span>${label}</span>`;
      lab.addEventListener('click', () => {
        choices.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
        lab.classList.add('selected');
        C_selected[qIdx] = i;
        updateConcoursCount();
      });
      choices.appendChild(lab);
    });
    card.appendChild(choices);
    r.ccList.appendChild(card);
  });
  updateConcoursCount();
}
function updateConcoursCount(){
  const r = refs();
  const answered = Object.keys(C_selected).length;
  if(r.ccCount) r.ccCount.textContent = `${answered} / ${C_QUESTIONS.length} répondues`;
}

export function bindConcoursControls(){
  const r = refs();
  if(r.ccBtnValidate){
    r.ccBtnValidate.addEventListener('click', validateConcours);
  }
}
function validateConcours(){
  stopCountdown();
  // Warning if unanswered
  const unanswered = C_QUESTIONS.length - Object.keys(C_selected).length;
  if(unanswered > 0){
    const ok = confirm(`Attention : ${unanswered} question(s) non répondue(s). Voulez-vous valider quand même ?`);
    if(!ok) return;
  }
  // Compute score
  let sc = 0;
  const bank = getThemeBank();
  C_QUESTIONS.forEach((q, qIdx) => {
    const pick = C_selected[qIdx];
    const ans = (bank[q.theme]?.answers?.[q.id] || {});
    if(pick !== undefined && (ans.correct || []).length === 1 && ans.correct[0] === pick){ sc++; }
    // Per-question feedback now (after validation)
    const list = document.getElementById('concours-list');
    const card = list ? list.querySelectorAll('.qitem')[qIdx] : null;
    if(card){
      let fb = card.querySelector('.cc-feedback');
      if(!fb){
        fb = document.createElement('div');
        fb.className = 'cc-feedback';
        fb.style.marginTop = '6px';
        card.appendChild(fb);
      }
      const ok = (pick !== undefined) && (ans.correct || []).length === 1 && ans.correct[0] === pick;
      fb.textContent = ok ? '✅ Bonne réponse' : '❌ Mauvaise réponse';
      // lock choices + highlight
      const choices = card.querySelectorAll('.choice');
      choices.forEach((lab, i) => {
        const input = lab.querySelector('input'); if(input) input.disabled = true;
        lab.classList.remove('ok','ko');
        const isCorrect = (ans.correct || []).includes(i);
        if(isCorrect){ lab.classList.add('ok'); }
        if(pick === i && !isCorrect){ lab.classList.add('ko'); }
      });
    }
  });
  // Show summary
  const r = refs();
  const total = C_QUESTIONS.length;
  const percent = Math.round(sc / total * 100);
  const note20 = Math.round((sc / total * 20) * 100) / 100;
  if(r.ccResText) r.ccResText.textContent = `Score : ${sc}/${total} (${percent} %). Note sur 20 : ${note20}/20.`;
  if(r.ccRes){ r.ccRes.style.display = 'block'; r.ccRes.scrollIntoView({behavior:'smooth'}); }
}
