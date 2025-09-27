let sampleData = null;

async function loadData() {
  if (!sampleData) {
    const res = await fetch("./assets/data.json");
    sampleData = await res.json();
  }
  return sampleData;
}

const Data = {
  themes: () => sampleData.themes,
  theme: (id) => sampleData.themes.find(t => t.id === id),
  coursesByTheme: (themeId) => sampleData.courses.filter(c => c.theme_id === themeId),
  chaptersByCourse: (courseId) => sampleData.chapters.filter(ch => ch.course_id === courseId),
  questionsByChapter: (chapterId) => sampleData.questions.filter(q => q.chapter_id === chapterId),
  choicesByQuestion: (questionId) => sampleData.choices.filter(c => c.question_id === questionId),
  getChapter: (id) => sampleData.chapters.find(ch => ch.id === id)
};

function qp(name){ return new URLSearchParams(location.search).get(name); }

function header(backHref=null){
  const back = backHref ? `<a href="${backHref}" class="muted">← Retour</a>` : "";
  return `
    <div class="header container">
      <div class="brand"><span class="accent">QCM</span> Pompier</div>
      <nav class="nav">
        <a href="index.html">Accueil</a>
      </nav>
    </div>
    <div class="container" style="padding-top:12px">${back}</div>
  `;
}

/* === PAGE ACCUEIL === */
async function pageHome(){
  document.body.innerHTML = `
    ${header()}
    <div class="container" style="text-align:center; margin-top:40px">
      <h1>Bienvenue sur <span class="accent">QCM</span> Pompier</h1>
      <p style="margin:20px 0; font-size:18px; line-height:1.6">
        Cet outil interactif te permet de réviser les connaissances des sapeurs-pompiers.<br>
        Tu pourras explorer différents thèmes, suivre les cours associés<br>
        et tester tes connaissances grâce à des QCM détaillés avec explications.
      </p>
      <a href="themes.html" class="btn">🚒 Commencer</a>
    </div>
  `;
}

/* === PAGE THEMES === */
async function pageThemes(){
  await loadData();
  const cards = Data.themes().map(t => `
    <a class="card theme-card" href="courses.html?theme=${t.id}">
      <div class="theme-icon" style="font-size:20px">${t.icon||""}</div>
      <div style="font-weight:800;margin-top:6px">${t.title}</div>
    </a>
  `).join("");
  document.body.innerHTML = `
    ${header()}
    <div class="container">
      <h2 style="margin:16px 0">Choisis un thème</h2>
      <div class="grid cols-2">${cards}</div>
    </div>
  `;
}

/* === PAGE COURS === */
async function pageCourses(){
  await loadData();
  const themeId = parseInt(qp("theme"),10);
  const theme = Data.theme(themeId);
  const items = Data.coursesByTheme(themeId).map(c => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div>
          <div style="font-weight:800">${c.title}</div>
        </div>
        <a class="btn secondary" href="chapters.html?course=${c.id}">Voir chapitres</a>
      </div>
    </div>
  `).join("");
  document.body.innerHTML = `
    ${header("themes.html")}
    <div class="container">
      <h2 style="margin:16px 0">${theme?.icon||"📚"} ${theme?.title||"Thème"}</h2>
      <div class="grid">${items}</div>
    </div>
  `;
}

/* === PAGE CHAPITRES === */
async function pageChapters(){
  await loadData();
  const courseId = parseInt(qp("course"),10);
  const chapters = Data.chaptersByCourse(courseId);
  const course = sampleData.courses.find(c => c.id === courseId);
  const items = chapters.map(ch => `
    <div class="card">
      <div style="font-weight:800">${ch.title}</div>
      <a class="btn" href="quiz.html?chapter=${ch.id}">Lancer le QCM</a>
    </div>
  `).join("");
  document.body.innerHTML = `
    ${header("courses.html?theme="+course.theme_id)}
    <div class="container">
      <h2 style="margin:16px 0">${course.title}</h2>
      <div class="grid">${items}</div>
    </div>
  `;
}

/* === PAGE QUIZ === */
async function pageQuiz(){
  await loadData();
  const chapterId = parseInt(qp("chapter"),10);
  const questions = Data.questionsByChapter(chapterId);

  const content = questions.map((q,i)=>{
    const choices = Data.choicesByQuestion(q.id);
    const choicesHtml = choices.map(c=>`
      <label class="choice">
        <input type="checkbox" name="q${q.id}" value="${c.id}">
        ${c.text}
      </label>
    `).join("");
    return `
      <div class="card" id="q${q.id}">
        <h3>Question ${i+1}</h3>
        <p>${q.text}</p>
        ${choicesHtml}
        <div class="feedback"></div>
      </div>
    `;
  }).join("");

  document.body.innerHTML = `
    ${header("chapters.html?course="+Data.getChapter(chapterId).course_id)}
    <div class="container">
      <h2>QCM - ${Data.getChapter(chapterId).title}</h2>
      <form id="quizForm">
        ${content}
        <button type="submit" class="btn">Valider le QCM</button>
      </form>
    </div>
  `;

  document.getElementById("quizForm").onsubmit = (e)=>{
    e.preventDefault();
    let score = 0;

    questions.forEach(q=>{
      const selected = [...document.querySelectorAll(`input[name=q${q.id}]:checked`)].map(el=>parseInt(el.value));
      const correctIds = Data.choicesByQuestion(q.id).filter(c=>c.is_correct).map(c=>c.id);
      const ok = JSON.stringify(selected.sort())===JSON.stringify(correctIds.sort());

      if(ok) score++; // ✅ Comptabilise la bonne réponse

      const feedback = document.querySelector(`#q${q.id} .feedback`);
      feedback.innerHTML = ok
        ? `<p style="color:green">✅ Correct</p><p class="muted">${q.explanation||""}</p>`
        : `<p style="color:red">❌ Incorrect</p><p class="muted">${q.explanation||""}</p>`;

      document.querySelectorAll(`#q${q.id} input`).forEach(el=>{
        const parent = el.parentElement;
        const val = parseInt(el.value);
        if(correctIds.includes(val)) parent.classList.add("correct");
        else if(el.checked) parent.classList.add("incorrect");
      });
    });

    // --- Calcul note ---
    const total = questions.length;
    const note20 = Math.round((score / total) * 20);

    // --- Supprime ancien résultat s’il existe ---
    const oldResult = document.getElementById("finalResult");
    if(oldResult) oldResult.remove();

    // --- Ajoute le résultat final ---
    const resultDiv = document.createElement("div");
    resultDiv.className = "card";
    resultDiv.id = "finalResult";
    resultDiv.innerHTML = `
      <h3>Résultat final</h3>
      <p>Tu as obtenu <strong>${score}/${total}</strong> bonnes réponses</p>
      <p>Note : <strong>${note20}/20</strong></p>
    `;
    document.getElementById("quizForm").appendChild(resultDiv);

    // --- Remplacer bouton ---
    const btn = e.target.querySelector("button[type=submit]");
    btn.textContent = "Retour au chapitre";
    btn.type = "button";
    btn.onclick = () => {
      location.href = "chapters.html?course=" + Data.getChapter(chapterId).course_id;
    };
  };
}

/* === ROUTER === */
window.addEventListener("DOMContentLoaded",()=>{ 
  const page=document.body.dataset.page;
  if(page==="home") return pageHome();
  if(page==="themes") return pageThemes();
  if(page==="courses") return pageCourses();
  if(page==="chapters") return pageChapters();
  if(page==="quiz") return pageQuiz();
});
