"use strict";

// ==========================================
// AI QUIZLY ADVANCED
// API: Open Trivia Database (Science: Computers)
// ==========================================

const API_URL = "https://opentdb.com/api.php";
const COMPUTER_CATEGORY = 18;

const subjects = [
  "Python",
  "Java",
  "HTML/CSS",
  "JavaScript",
  "DBMS",
  "DSA",
  "Operating System"
];

const STORAGE_KEYS = {
  history: "quizlyAdvHistory",
  theme: "quizlyAdvTheme",
  streak: "quizlyAdvStreak",
  settings: "quizlyAdvSettings"
};

// ==========================================
// 1. DOM HELPERS
// ==========================================

const $ = (id) => document.getElementById(id);

const topicInput = $("topicInput");
const subjectSelect = $("subjectSelect");
const generateBtn = $("generateBtn");

const quizPanel = $("quizPanel");
const resultPanel = $("resultPanel");
const reviewListPanel = $("reviewListPanel");
const welcomePanel = $("welcomePanel");

const quizTitle = $("quizTitle");
const quizSubtitle = $("quizSubtitle");
const questionNumber = $("questionNumber");
const totalQuestions = $("totalQuestions");
const progressFill = $("progressFill");
const progressText = $("progressText");
const questionText = $("questionText");
const answerGrid = $("answerGrid");
const answerFeedback = $("answerFeedback");
const difficultyBadge = $("difficultyBadge");

const timerValue = $("timerValue");
const scoreLive = $("scoreLive");

const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const skipBtn = $("skipBtn");
const quitQuizBtn = $("quitQuizBtn");

const resultTitle = $("resultTitle");
const resultSubject = $("resultSubject");
const resultScore = $("resultScore");
const resultPercent = $("resultPercent");
const resultAnswered = $("resultAnswered");
const resultMessage = $("resultMessage");
const resultIcon = $("resultIcon");
const resultBreakdown = $("resultBreakdown");
const reviewList = $("reviewList");

const restartBtn = $("restartBtn");
const reviewBtn = $("reviewBtn");
const newQuizBtn = $("newQuizBtn");

const statQuizzes = $("statQuizzes");
const statAnswered = $("statAnswered");
const statAverage = $("statAverage");
const statBest = $("statBest");
const statBestSubject = $("statBestSubject");
const scoreTrackFill = $("scoreTrackFill");
const recentActivity = $("recentActivity");
const streakCount = $("streakCount");

const dashboardBtn = $("dashboardBtn");
const myQuizzesLink = $("myQuizzesLink");
const historyBtn = $("historyBtn");
const brandLink = $("brandLink");

const historyModal = $("historyModal");
const historyModalBody = $("historyModalBody");
const closeHistoryBtn = $("closeHistoryBtn");
const closeHistoryBtn2 = $("closeHistoryBtn2");
const clearHistoryBtn = $("clearHistoryBtn");

const loadingOverlay = $("loadingOverlay");
const toastEl = $("toast");
const themeToggle = $("themeToggle");
const themeIcon = $("themeIcon");
const themeLabel = $("themeLabel");
const breadcrumbLabel = $("breadcrumbLabel");
const greetingText = $("greetingText");

// ==========================================
// 2. STATE
// ==========================================

let questions = [];
let currentQuestion = 0;
let currentSubject = "Python";
let selectedAnswers = [];
let secondsLeft = 20 * 60;
let timerInterval = null;

let isReviewing = false;
let quizFinished = false;

let history = loadJSON(STORAGE_KEYS.history, []);
let streakData = loadJSON(STORAGE_KEYS.streak, { lastDate: null, count: 0 });
let settings = loadJSON(STORAGE_KEYS.settings, {
  difficulty: "any",
  count: 20,
  timeMinutes: 20
});

let lastQuizSubject = "Python";
let lastSettings = { ...settings };

// ==========================================
// 3. UTILITIES
// ==========================================

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage write failed:", err);
  }
}

function decodeHTML(text) {
  const ta = document.createElement("textarea");
  ta.innerHTML = text;
  return ta.value;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function showToast(message, duration = 2800) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => {
      toastEl.hidden = true;
    }, 250);
  }, duration);
}

function setLoading(on) {
  loadingOverlay.hidden = !on;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function updateStreakOnComplete() {
  const today = todayKey();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  })();

  if (streakData.lastDate === today) {
    // already counted today
  } else if (streakData.lastDate === yesterday) {
    streakData.count += 1;
    streakData.lastDate = today;
  } else {
    streakData.count = 1;
    streakData.lastDate = today;
  }

  saveJSON(STORAGE_KEYS.streak, streakData);
  streakCount.textContent = streakData.count;
}

// ==========================================
// 4. THEME
// ==========================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  saveJSON(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const saved = loadJSON(STORAGE_KEYS.theme, null);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

// ==========================================
// 5. SUBJECTS & SETTINGS UI
// ==========================================

function setupSubjects() {
  subjectSelect.innerHTML = "";
  subjects.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subjectSelect.appendChild(opt);
  });
  subjectSelect.value = "Python";
}

function selectSubject(subject) {
  if (!subjects.includes(subject)) return;
  subjectSelect.value = subject;
  topicInput.value = subject;

  document.querySelectorAll(".topic-chip").forEach((chip) => {
    chip.classList.toggle("selected", chip.dataset.subject === subject);
  });
}

function setupSegmented(groupId, key, values) {
  const group = $(groupId);
  if (!group) return;

  group.querySelectorAll("button").forEach((btn) => {
    const val = btn.dataset.value;
    if (values.includes(val) || values.includes(Number(val))) {
      btn.classList.toggle(
        "chosen",
        String(settings[key]) === String(val)
      );
    }

    btn.addEventListener("click", () => {
      group.querySelectorAll("button").forEach((b) => b.classList.remove("chosen"));
      btn.classList.add("chosen");

      if (key === "count" || key === "timeMinutes") {
        settings[key] = Number(val);
      } else {
        settings[key] = val;
      }
      saveJSON(STORAGE_KEYS.settings, settings);
    });
  });
}

function initSettingsUI() {
  setupSegmented("difficultyGroup", "difficulty", ["any", "easy", "medium", "hard"]);
  setupSegmented("countGroup", "count", [10, 15, 20]);
  setupSegmented("timeGroup", "timeMinutes", [10, 15, 20]);
}

// ==========================================
// 6. FETCH QUESTIONS
// ==========================================

async function fetchQuestions(subject) {
  const params = new URLSearchParams({
    amount: String(settings.count),
    category: String(COMPUTER_CATEGORY),
    type: "multiple",
    encode: "url3986"
  });

  if (settings.difficulty && settings.difficulty !== "any") {
    params.set("difficulty", settings.difficulty);
  }

  const response = await fetch(`${API_URL}?${params}`);

  if (!response.ok) {
    throw new Error("API server se response nahi mila. Internet check karo.");
  }

  const data = await response.json();

  if (data.response_code === 1) {
    throw new Error(
      "Is difficulty / count ke liye enough questions nahi mile. " +
      "Difficulty “Any” try karo ya kam questions lo."
    );
  }
  if (data.response_code === 5) {
    throw new Error("API rate limit. 5 seconds wait karke dobara try karo.");
  }
  if (data.response_code !== 0 || !data.results?.length) {
    throw new Error("API se questions load nahi ho paaye.");
  }

  return data.results.map((item) => {
    const question = decodeURIComponent(item.question);
    const correctAnswer = decodeURIComponent(item.correct_answer);
    const incorrectAnswers = item.incorrect_answers.map((a) =>
      decodeURIComponent(a)
    );

    const options = [...incorrectAnswers, correctAnswer].sort(
      () => Math.random() - 0.5
    );

    return {
      question,
      options,
      correctAnswer,
      category: decodeURIComponent(item.category),
      difficulty: item.difficulty || "unknown",
      explanation:
        `Correct answer: ${correctAnswer}. ` +
        `Category: ${decodeURIComponent(item.category)} · Difficulty: ${item.difficulty}.`
    };
  });
}

// ==========================================
// 7. START / DISPLAY QUIZ
// ==========================================

async function startQuiz() {
  const subject = topicInput.value.trim() || subjectSelect.value;
  if (!subject) {
    showToast("Please select a subject.");
    return;
  }

  currentSubject = subject;
  lastQuizSubject = subject;
  lastSettings = { ...settings };

  clearInterval(timerInterval);
  generateBtn.disabled = true;
  setLoading(true);
  quizPanel.hidden = true;
  resultPanel.hidden = true;
  reviewListPanel.hidden = true;

  try {
    questions = await fetchQuestions(subject);

    currentQuestion = 0;
    selectedAnswers = Array(questions.length).fill(null);
    secondsLeft = settings.timeMinutes * 60;
    isReviewing = false;
    quizFinished = false;

    quizPanel.hidden = false;
    breadcrumbLabel.textContent = "Quiz";

    quizTitle.innerHTML = `${escapeHtml(subject)} Quiz <span class="live-dot"></span>`;
    quizSubtitle.textContent =
      `Science: Computers · ${settings.difficulty === "any" ? "Any difficulty" : capitalize(settings.difficulty)} · ${settings.timeMinutes} min`;

    totalQuestions.textContent = questions.length;
    difficultyBadge.textContent =
      settings.difficulty === "any"
        ? "PRACTICE"
        : settings.difficulty.toUpperCase();

    showQuestion();
    startTimer();

    quizPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`Loaded ${questions.length} questions`);
  } catch (error) {
    console.error("Quiz API error:", error);
    showToast(error.message || "Questions load nahi hue.");
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = 'Start quiz <span>→</span>';
    setLoading(false);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function showQuestion() {
  const q = questions[currentQuestion];
  if (!q) return;

  questionNumber.textContent = pad2(currentQuestion + 1);
  progressFill.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  progressText.textContent = `${currentQuestion + 1} of ${questions.length} questions`;
  questionText.textContent = q.question;

  answerGrid.innerHTML = "";
  answerFeedback.hidden = true;

  q.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-option";
    button.setAttribute("role", "option");
    button.dataset.index = String(index);

    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = String.fromCharCode(65 + index);

    const label = document.createElement("span");
    label.className = "answer-label";
    label.textContent = option;

    button.append(letter, label);

    if (!isReviewing && !quizFinished) {
      button.addEventListener("click", () => selectAnswer(option));
    }

    answerGrid.appendChild(button);
  });

  prevBtn.disabled = currentQuestion === 0;

  if (isReviewing) {
    nextBtn.textContent =
      currentQuestion === questions.length - 1
        ? "Back to results"
        : "Next →";
    skipBtn.hidden = true;
  } else {
    nextBtn.textContent =
      currentQuestion === questions.length - 1
        ? "Finish quiz ✓"
        : "Next →";
    skipBtn.hidden = false;
  }

  if (selectedAnswers[currentQuestion] !== null) {
    restoreAnswer();
  } else if (isReviewing) {
    // show correct answer in review even if skipped
    restoreAnswer(true);
  }

  updateLiveScore();
}

// ==========================================
// 8. ANSWER SELECTION
// ==========================================

function selectAnswer(answer) {
  if (quizFinished || isReviewing) return;

  // Allow changing answer until user moves to next question
  selectedAnswers[currentQuestion] = answer;
  restoreAnswer();
  updateLiveScore();
}

function restoreAnswer(forceShowCorrect = false) {
  const q = questions[currentQuestion];
  const chosen = selectedAnswers[currentQuestion];

  if (chosen === null && !forceShowCorrect) return;

  const correct = chosen === q.correctAnswer;

  [...answerGrid.children].forEach((button, index) => {
    const option = q.options[index];
    button.classList.remove("correct", "incorrect", "selected");

    if (isReviewing || quizFinished || chosen !== null) {
      button.disabled = true;
    }

    if (option === q.correctAnswer) {
      button.classList.add("correct");
    }
    if (chosen !== null && option === chosen && !correct) {
      button.classList.add("incorrect");
    }
    if (chosen !== null && option === chosen) {
      button.classList.add("selected");
    }
  });

  if (chosen !== null || isReviewing) {
    answerFeedback.hidden = false;
    const ok = chosen === q.correctAnswer;
    answerFeedback.className =
      `answer-feedback ${ok ? "correct-feedback" : "incorrect-feedback"}`;

    if (chosen === null) {
      answerFeedback.textContent = `Skipped. ${q.explanation}`;
      answerFeedback.className = "answer-feedback skip-feedback";
    } else if (ok) {
      answerFeedback.textContent = `Correct! ${q.explanation}`;
    } else {
      answerFeedback.textContent = `Not quite. ${q.explanation}`;
    }
  }
}

// ==========================================
// 9. SCORE
// ==========================================

function calculateScore() {
  return questions.reduce((score, q, i) => {
    return score + (selectedAnswers[i] === q.correctAnswer ? 1 : 0);
  }, 0);
}

function calculateAnswered() {
  return selectedAnswers.filter((a) => a !== null).length;
}

function updateLiveScore() {
  scoreLive.textContent = `${calculateScore()} pts`;
}

// ==========================================
// 10. NAVIGATION
// ==========================================

function goPrevious() {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
}

function goNext() {
  if (!questions.length) return;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function skipQuestion() {
  if (quizFinished || isReviewing) return;
  // leave as null and move on
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    finishQuiz();
  }
}

function quitQuiz() {
  if (quizFinished) return;
  if (!confirm("Quit this quiz? Progress for this attempt will be lost.")) return;

  clearInterval(timerInterval);
  quizFinished = true;
  quizPanel.hidden = true;
  resultPanel.hidden = true;
  reviewListPanel.hidden = true;
  breadcrumbLabel.textContent = "Dashboard";
  showToast("Quiz cancelled");
  welcomePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==========================================
// 11. TIMER
// ==========================================

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    if (quizFinished || isReviewing) return;

    secondsLeft--;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
  const seconds = Math.max(0, secondsLeft) % 60;
  timerValue.textContent = `${pad2(minutes)}:${pad2(seconds)}`;

  if (secondsLeft <= 60) {
    timerValue.classList.add("timer-warning");
  } else {
    timerValue.classList.remove("timer-warning");
  }
}

// ==========================================
// 12. FINISH QUIZ
// ==========================================

function finishQuiz(timeUp = false) {
  if (quizFinished) return;
  quizFinished = true;
  clearInterval(timerInterval);

  const score = calculateScore();
  const answered = calculateAnswered();
  const percentage = questions.length
    ? Math.round((score / questions.length) * 100)
    : 0;

  const attempt = {
    subject: currentSubject,
    score,
    total: questions.length,
    answered,
    percentage,
    difficulty: lastSettings.difficulty,
    timeMinutes: lastSettings.timeMinutes,
    date: new Date().toLocaleString(),
    timestamp: Date.now()
  };

  history.unshift(attempt);
  history = history.slice(0, 80);
  saveJSON(STORAGE_KEYS.history, history);

  updateStreakOnComplete();

  resultTitle.textContent = timeUp ? "Time's up!" : "Quiz complete!";
  resultSubject.textContent = `${currentSubject} · ${
    lastSettings.difficulty === "any" ? "Any" : capitalize(lastSettings.difficulty)
  } difficulty`;

  resultScore.textContent = `${score}/${questions.length}`;
  resultPercent.textContent = `${percentage}%`;
  resultAnswered.textContent = `${answered}/${questions.length}`;

  if (percentage >= 90) {
    resultIcon.textContent = "🏆";
    resultMessage.textContent = "Outstanding! Near-perfect accuracy.";
  } else if (percentage >= 70) {
    resultIcon.textContent = "🌟";
    resultMessage.textContent = "Great work! Keep pushing for mastery.";
  } else if (percentage >= 50) {
    resultIcon.textContent = "💪";
    resultMessage.textContent = "Solid effort. Review the mistakes and try again.";
  } else {
    resultIcon.textContent = "📚";
    resultMessage.textContent = "Keep learning — every attempt builds skill.";
  }

  // Breakdown by difficulty of the questions served
  const byDiff = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
  questions.forEach((q, i) => {
    const d = q.difficulty in byDiff ? q.difficulty : "medium";
    byDiff[d].t += 1;
    if (selectedAnswers[i] === q.correctAnswer) byDiff[d].c += 1;
  });

  resultBreakdown.innerHTML = "";
  ["easy", "medium", "hard"].forEach((d) => {
    if (byDiff[d].t === 0) return;
    const pct = Math.round((byDiff[d].c / byDiff[d].t) * 100);
    const row = document.createElement("div");
    row.className = "breakdown-row";
    row.innerHTML = `
      <span class="diff-tag ${d}">${capitalize(d)}</span>
      <span>${byDiff[d].c}/${byDiff[d].t}</span>
      <span class="breakdown-bar"><i style="width:${pct}%"></i></span>
      <strong>${pct}%</strong>
    `;
    resultBreakdown.appendChild(row);
  });

  // Build compact review list
  buildReviewList();

  quizPanel.hidden = true;
  resultPanel.hidden = false;
  reviewListPanel.hidden = false;
  breadcrumbLabel.textContent = "Results";

  updateDashboard();

  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildReviewList() {
  reviewList.innerHTML = "";
  questions.forEach((q, i) => {
    const chosen = selectedAnswers[i];
    const ok = chosen === q.correctAnswer;
    const item = document.createElement("div");
    item.className = `review-item ${chosen === null ? "skipped" : ok ? "ok" : "bad"}`;

    const status = chosen === null ? "Skipped" : ok ? "Correct" : "Wrong";
    item.innerHTML = `
      <div class="review-num">${pad2(i + 1)}</div>
      <div class="review-body">
        <strong>${escapeHtml(q.question)}</strong>
        <small>
          Your answer: <em>${chosen ? escapeHtml(chosen) : "—"}</em>
          · Correct: <em>${escapeHtml(q.correctAnswer)}</em>
        </small>
      </div>
      <span class="review-status">${status}</span>
    `;
    item.addEventListener("click", () => {
      isReviewing = true;
      currentQuestion = i;
      quizPanel.hidden = false;
      resultPanel.hidden = true;
      showQuestion();
      quizPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    reviewList.appendChild(item);
  });
}

// ==========================================
// 13. REVIEW MODE
// ==========================================

function reviewAnswers() {
  if (!questions.length) return;
  isReviewing = true;
  quizPanel.hidden = false;
  resultPanel.hidden = true;
  quizSubtitle.textContent = "Review mode — correct answers highlighted.";
  showQuestion();
  quizPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reviewNext() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    quizPanel.hidden = true;
    resultPanel.hidden = false;
  }
}

// ==========================================
// 14. DASHBOARD
// ==========================================

function updateDashboard() {
  const totalQuizzes = history.length;
  const totalAnswered = history.reduce((s, h) => s + (h.answered || 0), 0);
  const average = totalQuizzes
    ? Math.round(history.reduce((s, h) => s + h.percentage, 0) / totalQuizzes)
    : 0;

  let best = 0;
  let bestSub = "No quizzes yet";
  history.forEach((h) => {
    if (h.percentage > best) {
      best = h.percentage;
      bestSub = `${h.subject} · ${h.date}`;
    }
  });

  statQuizzes.textContent = totalQuizzes;
  statAnswered.textContent = totalAnswered;
  statAverage.textContent = `${average}%`;
  statBest.textContent = `${best}%`;
  statBestSubject.textContent = bestSub;

  if (scoreTrackFill) {
    scoreTrackFill.style.width = `${average}%`;
  }

  streakCount.textContent = streakData.count || 0;
  renderRecentActivity();
}

function renderRecentActivity() {
  recentActivity.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Your completed quizzes will appear here.";
    recentActivity.appendChild(empty);
    return;
  }

  history.slice(0, 6).forEach((item) => {
    const card = document.createElement("div");
    card.className = "activity-item";

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = `${item.subject} Quiz`;
    const date = document.createElement("small");
    date.textContent = `${item.date} · ${item.difficulty || "any"}`;
    details.append(name, date);

    const score = document.createElement("strong");
    score.className = "activity-score";
    score.textContent = `${item.percentage}%`;

    card.append(details, score);
    recentActivity.appendChild(card);
  });
}

// ==========================================
// 15. HISTORY MODAL
// ==========================================

function openHistory() {
  renderHistoryModal();
  historyModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeHistory() {
  historyModal.hidden = true;
  document.body.style.overflow = "";
}

function renderHistoryModal() {
  historyModalBody.innerHTML = "";
  if (!history.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No quizzes completed yet.";
    historyModalBody.appendChild(p);
    return;
  }

  const table = document.createElement("div");
  table.className = "history-table";

  history.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span class="h-idx">${index + 1}</span>
      <div class="h-main">
        <strong>${escapeHtml(item.subject)}</strong>
        <small>${escapeHtml(item.date)} · ${escapeHtml(item.difficulty || "any")} · ${item.timeMinutes || "?"} min</small>
      </div>
      <span class="h-score">${item.score}/${item.total}</span>
      <strong class="h-pct">${item.percentage}%</strong>
    `;
    table.appendChild(row);
  });

  historyModalBody.appendChild(table);
}

function clearHistory() {
  if (!history.length) {
    showToast("History already empty");
    return;
  }
  if (!confirm("Clear all quiz history? This cannot be undone.")) return;
  history = [];
  saveJSON(STORAGE_KEYS.history, history);
  updateDashboard();
  renderHistoryModal();
  showToast("History cleared");
}

// ==========================================
// 16. NAV HELPERS
// ==========================================

function showDashboard() {
  resultPanel.hidden = true;
  quizPanel.hidden = true;
  reviewListPanel.hidden = true;
  breadcrumbLabel.textContent = "Dashboard";
  setActiveNav(dashboardBtn);
  welcomePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveNav(el) {
  document.querySelectorAll(".nav-link").forEach((a) => a.classList.remove("active"));
  if (el) el.classList.add("active");
}

// ==========================================
// 17. KEYBOARD SHORTCUTS
// ==========================================

function onKeyDown(e) {
  // Don't intercept when typing in inputs
  if (e.target.matches("input, textarea, select")) return;

  if (!historyModal.hidden) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeHistory();
    }
    return;
  }

  if (quizPanel.hidden || quizFinished) return;

  if (e.key === "Escape") {
    e.preventDefault();
    quitQuiz();
    return;
  }

  if (isReviewing) {
    if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault();
      reviewNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
      }
    }
    return;
  }

  // Number keys 1-4
  if (["1", "2", "3", "4"].includes(e.key)) {
    const idx = Number(e.key) - 1;
    const q = questions[currentQuestion];
    if (q && q.options[idx] !== undefined) {
      e.preventDefault();
      selectAnswer(q.options[idx]);
    }
    return;
  }

  if (e.key === "ArrowRight" || e.key === "Enter") {
    e.preventDefault();
    goNext();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    goPrevious();
  } else if (e.key.toLowerCase() === "s") {
    e.preventDefault();
    skipQuestion();
  }
}

// ==========================================
// 18. EVENT LISTENERS
// ==========================================

generateBtn.addEventListener("click", startQuiz);

topicInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});

subjectSelect.addEventListener("change", () => {
  selectSubject(subjectSelect.value);
});

document.querySelectorAll(".topic-chip").forEach((chip) => {
  chip.addEventListener("click", () => selectSubject(chip.dataset.subject));
});

$("subjectList")?.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectSubject(btn.dataset.subject);
    $("generator").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

prevBtn.addEventListener("click", () => {
  if (isReviewing) {
    if (currentQuestion > 0) {
      currentQuestion--;
      showQuestion();
    }
  } else {
    goPrevious();
  }
});

nextBtn.addEventListener("click", () => {
  if (isReviewing) reviewNext();
  else goNext();
});

skipBtn.addEventListener("click", skipQuestion);
quitQuizBtn.addEventListener("click", quitQuiz);

restartBtn.addEventListener("click", () => {
  selectSubject(lastQuizSubject);
  // restore last settings visually
  settings = { ...lastSettings };
  saveJSON(STORAGE_KEYS.settings, settings);
  initSettingsUI();
  startQuiz();
});

reviewBtn.addEventListener("click", reviewAnswers);

newQuizBtn.addEventListener("click", () => {
  quizPanel.hidden = true;
  resultPanel.hidden = true;
  reviewListPanel.hidden = true;
  breadcrumbLabel.textContent = "Dashboard";
  $("generator").scrollIntoView({ behavior: "smooth", block: "start" });
});

dashboardBtn.addEventListener("click", (e) => {
  e.preventDefault();
  showDashboard();
});

brandLink.addEventListener("click", (e) => {
  e.preventDefault();
  showDashboard();
});

myQuizzesLink.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveNav(myQuizzesLink);
  $("generator").scrollIntoView({ behavior: "smooth", block: "start" });
});

historyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveNav(historyBtn);
  openHistory();
});

closeHistoryBtn.addEventListener("click", closeHistory);
closeHistoryBtn2.addEventListener("click", closeHistory);
clearHistoryBtn.addEventListener("click", clearHistory);

historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) closeHistory();
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

document.addEventListener("keydown", onKeyDown);

// Greeting by time of day
(function setGreeting() {
  const h = new Date().getHours();
  if (h < 12) greetingText.textContent = "Good morning ☀️";
  else if (h < 17) greetingText.textContent = "Good afternoon 👋";
  else greetingText.textContent = "Good evening 🌙";
})();

// ==========================================
// 19. INIT
// ==========================================

setupSubjects();
initSettingsUI();
initTheme();
updateDashboard();
selectSubject("Python");