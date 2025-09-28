// ====== DATA LOADING ======
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

function qp(name) {
  return new URLSearchParams(location.search).get(name);
}

// ====== BURGER MENU ======
window.toggleMenu = function () {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("show");
};

// ====== BOUTON RETOUR ======
function backLink(href) {
  return `<div class="container" style="padding-top:12px">
    <a href="${href}" class="muted">← Retour</a>
  </div>`;
}

// ====== PAGES ======
async function pageThemes() {
  await loadData();
  const content = document.getElementById("content");
  const cards = Data.themes().map(t => `
    <a class="card" href="courses.html?theme=${t.id}">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:20px">${t.icon || ""}</div>
        <div style="font-weight:800">${t.title}</div>
      </div>
    </a>
  `).join("");
  content.innerHTML = `
    <h2 style="margin:16px 0">Thèmes</h2>
    <div class="grid cols-2">${cards}</div>
  `;
}

async function pageCourses() {
  await loadData();
  const content = document.getElementById("content");
  const themeId = parseInt(qp("theme"), 10);
  const theme = Data.theme(themeId);
  const items = Data.coursesByTheme(themeId).map(c => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div><div style="font-weight:800">${c.title}</div></div>
        <a class="btn secondary" href="chapters.html?course=${c.id}">Voir chapitres</a>
      </div>
    </div>
  `).join("");
  content.innerHTML = `
    ${backLink("themes.html")}
    <h2 style="margin:16px 0">${theme?.icon || "📚"} ${theme?.title || "Thème"}</h2>
    <div class="grid">${items}</div>
  `;
}

async function pageChapters() {
  await loadData();
  const content = document.getElementById("content");
  const courseId = parseInt(qp("course"), 10);
  const chapters = Data.chaptersByCourse(courseId);
  const course = sampleData.courses.find(c => c.id === courseId);
  const items = chapters.map(ch => `
    <div class="card">
      <div style="font-weight:800">${ch.title}</div>
      <a class="btn" href="quiz.html?chapter=${ch.id}">Lancer le QCM</a>
    </div>
  `).join("");
  content.innerHTML = `
    ${backLink("courses.html?theme=" + course.theme_id)}
    <h2 style="margin:16px 0">${course.title}</h2>
    <div class="grid">${items}</div>
  `;
}

async function pageQuiz() {
  await loadData();
  const content = document.getElementById("content");
  const chapterId = parseInt(qp("chapter"), 10);
  const chapter = Data.getChapter(chapterId);
  const questions = Data.questionsByChapter(chapterId);

  const contentQuestions = questions.map((q, i) => {
    const choices = Data.choicesByQuestion(q.id);
    const choicesHtml = choices.map(c => `
      <label class="choice">
        <input type="checkbox" name="q${q.id}" value="${c.id}">
        ${c.text}
      </label>
    `).join("");
    return `
      <div class="card" id="q${q.id}">
        <h3>Question ${i + 1}</h3>
        <p>${q.text}</p>
        ${choicesHtml}
        <div class="feedback"></div>
      </div>
    `;
  }).join("");

  content.innerHTML = `
    ${backLink("chapters.html?course=" + chapter.course_id)}
    <h2 style="margin:16px 0">QCM - ${chapter.title}</h2>
    <form id="quizForm">
      ${contentQuestions}
      <button type="submit" class="btn">Valider le QCM</button>
    </form>
  `;

  // Validation du QCM
  document.getElementById("quizForm").onsubmit = (e) => {
    e.preventDefault();
    let score = 0;

    questions.forEach(q => {
      const selected = [...document.querySelectorAll(`input[name=q${q.id}]:checked`)].map(el => parseInt(el.value));
      const correctIds = Data.choicesByQuestion(q.id).filter(c => c.is_correct).map(c => c.id);
      const ok = JSON.stringify(selected.sort()) === JSON.stringify(correctIds.sort());

      if (ok) score++;

      const feedback = document.querySelector(`#q${q.id} .feedback`);
      feedback.innerHTML = ok
        ? `<p style="color:green">✅ Correct</p><p class="muted">${q.explanation || ""}</p>`
        : `<p style="color:red">❌ Incorrect</p><p class="muted">${q.explanation || ""}</p>`;

      document.querySelectorAll(`#q${q.id} input`).forEach(el => {
        const parent = el.parentElement;
        const val = parseInt(el.value);
        if (correctIds.includes(val)) parent.classList.add("correct");
        else if (el.checked) parent.classList.add("incorrect");
      });
    });

    const total = questions.length;
    const note20 = Math.round((score / total) * 20);

    // Résultat final
    const oldResult = document.getElementById("finalResult");
    if (oldResult) oldResult.remove();

    const resultDiv = document.createElement("div");
    resultDiv.className = "card";
    resultDiv.id = "finalResult";
    resultDiv.innerHTML = `
      <h3>Résultat final</h3>
      <p>Tu as obtenu <strong>${score}/${total}</strong> bonnes réponses</p>
      <p>Note : <strong>${note20}/20</strong></p>
    `;
    document.getElementById("quizForm").appendChild(resultDiv);

    // Bouton retour sécurisé
    const chapter = Data.getChapter(chapterId);
    if (chapter) {
      const btn = e.target.querySelector("button");
      btn.textContent = "Retour au chapitre";
      btn.type = "button";
      btn.onclick = () => {
        location.href = "chapters.html?course=" + chapter.course_id;
      };
    }
  };
}

// ====== ROUTER ======
window.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  if (page === "themes") return pageThemes();
  if (page === "courses") return pageCourses();
  if (page === "chapters") return pageChapters();
  if (page === "quiz") return pageQuiz();
});
