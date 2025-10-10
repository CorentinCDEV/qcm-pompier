// Helpers
const pad2 = (n)=> String(n).padStart(2,'0');
function formatHMS(totalSeconds){const s=Math.max(0,Math.floor(totalSeconds));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;}
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function sampleWithReplacement(arr,n){const out=[];if(arr.length===0)return out;while(out.length<n){out.push(arr[out.length%arr.length]);}return shuffle(out).slice(0,n);}

// Header mobile drawer
const burger=document.querySelector('.burger');const drawer=document.getElementById('mobile-drawer');
if(burger&&drawer){const closeDrawer=()=>{drawer.hidden=true;burger.setAttribute('aria-expanded','false')};const openDrawer=()=>{drawer.hidden=false;burger.setAttribute('aria-expanded','true')};
burger.addEventListener('click',()=>{const open=burger.getAttribute('aria-expanded')==='true';open?closeDrawer():openDrawer();});
drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeDrawer));
document.addEventListener('click',(e)=>{const within=drawer.contains(e.target)||burger.contains(e.target);if(!within){closeDrawer();}});}

// Contact page email via FormSubmit
(function(){const form=document.getElementById('contact-form');if(!form)return;const statusEl=document.getElementById('form-status');form.addEventListener('submit',async(e)=>{
e.preventDefault();statusEl.textContent='Envoi en cours…';const data=Object.fromEntries(new FormData(form).entries());
try{const resp=await fetch('https://formsubmit.co/ajax/YOUR_EMAIL@domain.tld',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...data,_subject:'QCM pompier — Nouveau message',_captcha:'false'})});
if(!resp.ok) throw new Error('HTTP '+resp.status);await resp.json();statusEl.textContent='Merci, votre message a été envoyé.';form.reset();}
catch(err){statusEl.textContent='Erreur lors de l’envoi. Vérifiez la configuration.';console.error(err);}});})();

// Router (index)
function showSection(hash){const a=document.getElementById('accueil-sec');const t=document.getElementById('themes-sec');const q=document.getElementById('qcm-sec');const c=document.getElementById('concours-sec');if(!a)return;
a.style.display=t.style.display='block';q.style.display=c.style.display='none';if(hash==='#qcm'){a.style.display=t.style.display='none';q.style.display='block';}if(hash==='#concours'){a.style.display=t.style.display='none';c.style.display='block';}if(hash==='#themes'){a.style.display='none';}}
window.addEventListener('hashchange',()=>showSection(location.hash));showSection(location.hash||'#accueil');

// Manifest & banks
const MANIFEST_URL='assets/questions/manifest.json';let MANIFEST=null;let THEME_BANK={};
async function loadManifest(){if(MANIFEST) return MANIFEST;const res=await fetch(MANIFEST_URL,{cache:'no-store'});if(!res.ok) throw new Error('manifest HTTP '+res.status);MANIFEST=await res.json();return MANIFEST;}
async function loadTheme(themeKey){await loadManifest();if(THEME_BANK[themeKey]) return THEME_BANK[themeKey];const theme=MANIFEST.themes.find(t=>t.key===themeKey);if(!theme) throw new Error('Thème inconnu: '+themeKey);
const [qRes,aRes]=await Promise.all([fetch(theme.questions,{cache:'no-store'}),fetch(theme.answers,{cache:'no-store'})]);const questions=await qRes.json();const answers=await aRes.json();THEME_BANK[themeKey]={questions,answers};return THEME_BANK[themeKey];}
async function loadAllThemes(){await loadManifest();await Promise.all(MANIFEST.themes.map(t=>loadTheme(t.key)));return THEME_BANK;}

// QCM séquentiel
let QUESTIONS=[],idx=0,score=0;
const elQuestion=document.getElementById('question');const elChoices=document.getElementById('choices');const elValidate=document.getElementById('validate');const elNext=document.getElementById('next');
const elBar=document.getElementById('bar');const elChipIdx=document.getElementById('chipIndex');const elChipScore=document.getElementById('chipScore');const elChipTheme=document.getElementById('chipTheme');const elChipCourse=document.getElementById('chipCourse');const elChipChapter=document.getElementById('chipChapter');
const elFeedback=document.getElementById('feedback');const elFbIcon=document.getElementById('fb-icon');const elFbTitle=document.getElementById('fb-title');const elFbAnswers=document.getElementById('fb-answers');const elResult=document.getElementById('result');const elResText=document.getElementById('res-text');

function renderQuestion(){const q=QUESTIONS[idx];if(!q||!elChoices) return;elQuestion.textContent=q.text||'—';elChoices.innerHTML='';(q.choices||[]).forEach((label,i)=>{const item=document.createElement('label');item.className='choice';item.dataset.index=i;item.dataset.type='single';item.innerHTML=`<input type="radio" name="choice"><span>${label}</span>`;
item.addEventListener('click',()=>{elChoices.querySelectorAll('.choice').forEach(c=>c.classList.remove('selected'));item.classList.add('selected');});elChoices.appendChild(item);});
elChipIdx.textContent=`${idx+1} / ${QUESTIONS.length}`;elBar.style.width=`${(idx)/QUESTIONS.length*100}%`;elChipTheme.textContent=`Thème: ${q.theme||'—'}`;elChipCourse.textContent=`GTO: ${q.course||'—'}`;elChipChapter.textContent=`Chapitre: ${q.chapter||'—'}`;
elValidate.disabled=false;elNext.disabled=true;elFeedback.style.display='none';elResult.style.display='none';}
function getSelected(){const arr=[];document.querySelectorAll('.choice.selected').forEach(c=>arr.push(parseInt(c.dataset.index,10)));return arr.sort((a,b)=>a-b);}
function arraysEqual(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}

elValidate&&elValidate.addEventListener('click',()=>{const q=QUESTIONS[idx];const sel=getSelected();if(!sel.length){alert('Sélectionnez une réponse.');return;}const ans=(THEME_BANK[q.theme]?.answers?.[q.id]||{});
const ok=arraysEqual(sel,(ans.correct||[]));if(ok) score++;elFbIcon.className='icon '+(ok?'ok':'ko');elFeedback.className='feedback '+(ok?'ok':'ko');elFbTitle.textContent=ok?'Bonne réponse':'Mauvaise réponse';
elFbAnswers.innerHTML='';(q.choices||[]).forEach((label,i)=>{const p=document.createElement('div');const isOk=(ans.correct||[]).includes(i);const wasPicked=sel.includes(i);p.className='ans '+(isOk?'ok':(wasPicked?'ko':''));p.innerHTML=`${isOk?'✅':(wasPicked?'❌':'•')} ${label}`;elFbAnswers.appendChild(p);});
elFeedback.style.display='block';elChipScore.textContent=`Score: ${score}`;elValidate.disabled=true;elNext.disabled=false;if(idx===QUESTIONS.length-1){elBar.style.width='100%';}});

elNext&&elNext.addEventListener('click',()=>{if(idx<QUESTIONS.length-1){idx++;renderQuestion();}else{const total=QUESTIONS.length;const percent=Math.round(score/total*100);const note20=Math.round((score/total*20)*100)/100;
elResText.textContent=`Score : ${score}/${total} (${percent} %). Note sur 20 : ${note20}/20.`;document.getElementById('res-title').textContent=percent>=70?'Bravo !':'Session terminée';elResult.style.display='block';window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});}});

document.querySelectorAll('[data-start-random]').forEach(el=>el.addEventListener('click',async()=>{try{const bank=await loadAllThemes();let pool=[];for(const k of Object.keys(bank)) pool=pool.concat(bank[k].questions);
QUESTIONS=sampleWithReplacement(pool,20);idx=0;score=0;renderQuestion();elChipIdx.textContent=`1 / ${QUESTIONS.length}`;elChipScore.textContent='Score: 0';if(location.hash!=='#qcm') location.hash='#qcm'; else showSection('#qcm');}catch(e){alert('Erreur de chargement des questions.');}}));

// Concours
const NOMINAL_TOTAL=70,TOTAL=70,DURATION=3600;let C_QUESTIONS=[],C_selected={},countdownInterval=null,countdownEndTs=0;
const ccTitle=document.getElementById('cc-title');const ccTimer=document.getElementById('cc-timer');const ccList=document.getElementById('concours-list');const ccCount=document.getElementById('cc-chipCount');const ccRes=document.getElementById('cc-result');const ccResText=document.getElementById('cc-res-text');const ccBtnValidate=document.getElementById('cc-validate');

function startCountdown(seconds){stopCountdown();countdownEndTs=Date.now()+seconds*1000;updateTimer();countdownInterval=setInterval(updateTimer,200);}
function stopCountdown(){if(countdownInterval){clearInterval(countdownInterval);countdownInterval=null;}}
function updateTimer(){if(!ccTimer) return;const left=Math.max(0,Math.ceil((countdownEndTs-Date.now())/1000));ccTimer.textContent=formatHMS(left);if(left<=0){stopCountdown();alert('⏰ Temps écoulé : l’épreuve est terminée.');validateConcours();}}
async function startConcours(filters={}){try{const bank=await loadAllThemes();let pool=[];for(const k of Object.keys(bank)) pool=pool.concat(bank[k].questions);
C_QUESTIONS=sampleWithReplacement(pool,TOTAL);C_selected={};renderConcoursList();ccRes.style.display='none';ccTitle.textContent=`Mode concours — ${NOMINAL_TOTAL} questions`;ccCount.textContent=`0 / ${TOTAL} répondues`;startCountdown(DURATION);
if(location.hash!=='#concours') location.hash='#concours'; else showSection('#concours');}catch(e){alert('Erreur de chargement des questions (manifest / JSON).');}}
document.querySelectorAll('[data-start-concours]').forEach(el=>el.addEventListener('click',()=>startConcours({})));

function renderConcoursList(){if(!ccList) return;ccList.innerHTML='';C_QUESTIONS.forEach((q,qIdx)=>{const card=document.createElement('div');card.className='qitem';const head=document.createElement('div');head.className='qhead';
const title=document.createElement('div');title.innerHTML=`<strong>Q${qIdx+1}.</strong> ${q.text}`;head.appendChild(title);card.appendChild(head);const choices=document.createElement('div');choices.className='choices';
(q.choices||[]).forEach((label,i)=>{const lab=document.createElement('label');lab.className='choice';lab.dataset.index=i;lab.dataset.qidx=qIdx;lab.innerHTML=`<input type="radio" name="q_${qIdx}"><span>${label}</span>`;
lab.addEventListener('click',()=>{choices.querySelectorAll('.choice').forEach(c=>c.classList.remove('selected'));lab.classList.add('selected');C_selected[qIdx]=i;updateConcoursCount();});choices.appendChild(lab);});
card.appendChild(choices);ccList.appendChild(card);});updateConcoursCount();}
function updateConcoursCount(){const answered=Object.keys(C_selected).length;ccCount.textContent=`${answered} / ${C_QUESTIONS.length} répondues`;}
function validateConcours(){stopCountdown();let sc=0;C_QUESTIONS.forEach((q,qIdx)=>{const pick=C_selected[qIdx];const ans=(THEME_BANK[q.theme]?.answers?.[q.id]||{});if(pick!==undefined&&(ans.correct||[]).length===1&&ans.correct[0]===pick){sc++;}});
const total=C_QUESTIONS.length;const percent=Math.round(sc/total*100);const note20=Math.round((sc/total*20)*100)/100;ccResText.textContent=`Score : ${sc}/${total} (${percent} %). Note sur 20 : ${note20}/20.`;ccRes.style.display='block';ccRes.scrollIntoView({behavior:'smooth'});}


// ===== v16: Thème → GTO → Chapitre modal =====
const selModal = document.getElementById('selector-modal');
const selClose = document.getElementById('sel-close');
const selTheme = document.getElementById('sel-theme');
const selCourse = document.getElementById('sel-course');
const selChapter = document.getElementById('sel-chapter');
const selStartQcm = document.getElementById('sel-start-qcm');
const selStartConcours = document.getElementById('sel-start-concours');

function openSelector(themeKey){
  return loadTheme(themeKey).then(bank => {
    selTheme.textContent = `Thème : ${themeKey}`;
    // Fill courses and chapters
    const courses = Array.from(new Set(bank.questions.map(q=>q.course))).sort();
    selCourse.innerHTML = `<option value="">Tous les GTO</option>` + courses.map(c=>`<option value="${c}">${c}</option>`).join('');
    const chapters = Array.from(new Set(bank.questions.map(q=>q.chapter))).sort();
    selChapter.innerHTML = `<option value="">Tous les chapitres</option>` + chapters.map(ch=>`<option value="${ch}">${ch}</option>`).join('');
    selCourse.onchange = () => {
      const c = selCourse.value;
      const chs = Array.from(new Set(bank.questions.filter(q=>!c || q.course===c).map(q=>q.chapter))).sort();
      selChapter.innerHTML = `<option value="">Tous les chapitres</option>` + chs.map(x=>`<option value="${x}">${x}</option>`).join('');
    };
    selModal.style.display = 'flex';
    selModal.focus();
    selModal.dataset.theme = themeKey;
  });
}
if(selClose){ selClose.addEventListener('click', ()=> selModal.style.display='none'); }
if(selModal){
  selModal.addEventListener('click', (e)=>{
    if(e.target === selModal) selModal.style.display='none';
  });
}
if(selStartQcm){
  selStartQcm.addEventListener('click', async ()=>{
    const theme = selModal.dataset.theme;
    const filters = { theme };
    if(selCourse.value) filters.course = selCourse.value;
    if(selChapter.value) filters.chapter = selChapter.value;
    selModal.style.display='none';
    // Start a 20-random session with filters
    try{
      const bank = await loadAllThemes();
      let pool=[]; for(const k of Object.keys(bank)){ pool = pool.concat(bank[k].questions); }
      if(filters.theme){ pool = pool.filter(q=> q.theme === filters.theme); }
      if(filters.course){ pool = pool.filter(q=> q.course === filters.course); }
      if(filters.chapter){ pool = pool.filter(q=> q.chapter === filters.chapter); }
      QUESTIONS = sampleWithReplacement(pool, 20);
      idx=0; score=0; renderQuestion();
      elChipIdx.textContent = `1 / ${QUESTIONS.length}`;
      elChipScore.textContent = `Score: 0`;
      if (location.hash !== '#qcm') location.hash = '#qcm'; else showSection('#qcm');
    }catch(e){ alert("Erreur de chargement des questions."); }
  });
}
if(selStartConcours){
  selStartConcours.addEventListener('click', async ()=>{
    const theme = selModal.dataset.theme;
    const filters = { theme };
    if(selCourse.value) filters.course = selCourse.value;
    if(selChapter.value) filters.chapter = selChapter.value;
    selModal.style.display='none';
    // Reuse startConcours but with filters
    try{
      const bank = await loadAllThemes();
      let pool=[]; for(const k of Object.keys(bank)){ pool = pool.concat(bank[k].questions); }
      if(filters.theme){ pool = pool.filter(q=> q.theme === filters.theme); }
      if(filters.course){ pool = pool.filter(q=> q.course === filters.course); }
      if(filters.chapter){ pool = pool.filter(q=> q.chapter === filters.chapter); }
      C_QUESTIONS = sampleWithReplacement(pool, TOTAL);
      C_selected = {};
      renderConcoursList();
      ccRes.style.display = 'none';
      ccTitle.textContent = `Mode concours — ${NOMINAL_TOTAL} questions`;
      ccCount.textContent = `0 / ${TOTAL} répondues`;
      startCountdown(DURATION);
      if (location.hash !== '#concours') location.hash = '#concours'; else showSection('#concours');
    }catch(e){ alert("Erreur de chargement des questions (manifest / JSON)."); }
  });
}
// attach on theme cards
document.querySelectorAll('.theme-card').forEach(card => {
  card.addEventListener('click', async (e) => {
    e.preventDefault();
    const theme = card.getAttribute('data-theme');
    try{ await openSelector(theme); }catch(err){ alert('Erreur de chargement du thème.'); }
  });
});
