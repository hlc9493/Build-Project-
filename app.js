// Processing layer: loads the skills, draws the screens, counts progress.
// Milestone 2: several trainees, and every tick is saved in this browser.
// Milestone 3: a "Cover next shift" list, and a way to remove a trainee.
// Upgrade: team overview, station-ready badges, dates and notes, celebration.

const STORAGE_KEY = "trainingTracker";
const NEXT_COUNT = 3;     // how many skills to suggest for the next shift

const checklist = document.getElementById("checklist");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const traineeName = document.getElementById("trainee-name");
const traineeMeta = document.getElementById("trainee-meta");
const traineeSelect = document.getElementById("trainee-select");
const addForm = document.getElementById("add-form");
const newName = document.getElementById("new-name");
const removeButton = document.getElementById("remove-button");
const badgesBox = document.getElementById("badges");
const completeBanner = document.getElementById("complete-banner");
const nextCard = document.getElementById("next-card");
const nextList = document.getElementById("next-list");
const nextNote = document.getElementById("next-note");
const teamCard = document.getElementById("team-card");
const teamList = document.getElementById("team-list");
const confetti = document.getElementById("confetti");

let categories = [];      // filled in from skills.json
let state = loadState();  // the trainees and what each one has covered
let openNote = null;      // the skill whose note box is open, if any

// Data layer, part 1: the list of skills lives in skills.json.
fetch("skills.json")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    categories = data.categories;
    drawEverything();
  })
  .catch(function () {
    progressText.textContent =
      "Could not load skills.json. Open the app from its GitHub Pages link.";
    progressText.className = "error";
  });

// Data layer, part 2: trainee progress lives in this browser's localStorage.
// Each trainee looks like:
// { name: "Sam", started: "2026-11-19", done: ["Steams milk"],
//   dates: { "Steams milk": "2026-11-20" }, notes: { "Steams milk": "needs practice" } }
function loadState() {
  let loaded = { trainees: [], current: 0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      loaded = JSON.parse(saved);
    }
  } catch (error) {
    // Storage is blocked or the saved text is broken: start fresh.
  }

  // Trainees saved by the older version have no dates or notes yet.
  loaded.trainees.forEach(function (trainee) {
    trainee.done = trainee.done || [];
    trainee.dates = trainee.dates || {};
    trainee.notes = trainee.notes || {};
    trainee.started = trainee.started || today();
  });
  if (!(loaded.current < loaded.trainees.length)) {
    loaded.current = 0;
  }
  return loaded;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Storage is blocked: the app still works until the page is closed.
  }
}

function currentTrainee() {
  return state.trainees[state.current];
}

// ---------- Date helpers ----------

// Today's date as "2026-11-19", in the trainer's own time zone.
function today() {
  const now = new Date();
  return now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
}

function toDate(text) {
  const parts = text.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// "2026-11-19" becomes "Nov 19".
function niceDate(text) {
  return toDate(text).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Day 1 is the day the trainee was added.
function dayOfTraining(trainee) {
  const days = Math.round((toDate(today()) - toDate(trainee.started)) / 86400000);
  return days + 1;
}

// ---------- Counting ----------

function countProgress(trainee) {
  let total = 0;
  let done = 0;
  categories.forEach(function (category) {
    category.skills.forEach(function (skill) {
      total = total + 1;
      if (trainee.done.includes(skill)) {
        done = done + 1;
      }
    });
  });
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done: done, total: total, percent: percent };
}

function categoryComplete(trainee, category) {
  return category.skills.every(function (skill) {
    return trainee.done.includes(skill);
  });
}

// The badge text can be set in skills.json; otherwise it is made from the name.
function badgeName(category) {
  return category.badge || category.name + " ready";
}

function readyBadges(trainee) {
  return categories
    .filter(function (category) {
      return categoryComplete(trainee, category);
    })
    .map(badgeName);
}

// ---------- Actions ----------

// Adding a trainee: put them on the list, switch to them, save.
addForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = newName.value.trim();
  if (name === "") {
    return;
  }
  state.trainees.push({ name: name, started: today(), done: [], dates: {}, notes: {} });
  state.current = state.trainees.length - 1;
  openNote = null;
  saveState();
  newName.value = "";
  drawEverything();
});

// Switching trainee with the dropdown.
traineeSelect.addEventListener("change", function () {
  selectTrainee(Number(traineeSelect.value));
});

function selectTrainee(index) {
  state.current = index;
  openNote = null;
  saveState();
  drawEverything();
}

// Removing a trainee: ask first, because their progress goes with them.
removeButton.addEventListener("click", function () {
  const trainee = currentTrainee();
  if (!trainee) {
    return;
  }
  if (window.confirm("Remove " + trainee.name + " and their progress?")) {
    state.trainees.splice(state.current, 1);
    state.current = 0;
    openNote = null;
    saveState();
    drawEverything();
  }
});

// Ticking or unticking a skill: record the date, save, celebrate at 100%.
function setSkill(trainee, skill, covered) {
  const wasComplete = countProgress(trainee).percent === 100;

  if (covered) {
    if (!trainee.done.includes(skill)) {
      trainee.done.push(skill);
    }
    trainee.dates[skill] = today();
  } else {
    trainee.done = trainee.done.filter(function (item) {
      return item !== skill;
    });
    delete trainee.dates[skill];
  }
  saveState();
  drawEverything();

  if (!wasComplete && countProgress(trainee).percent === 100) {
    celebrate();
  }
}

function setNote(trainee, skill, text) {
  const note = text.trim();
  if (note === "") {
    delete trainee.notes[skill];
  } else {
    trainee.notes[skill] = note;
  }
  openNote = null;
  saveState();
  drawEverything();
}

// ---------- Drawing ----------

function drawEverything() {
  drawTeam();
  drawPicker();
  drawSummary();
  drawNext();
  drawChecklist();
}

// Team overview: one row per trainee; tapping a row opens that trainee.
function drawTeam() {
  teamList.innerHTML = "";
  teamCard.hidden = state.trainees.length === 0;

  state.trainees.forEach(function (trainee, index) {
    const progress = countProgress(trainee);
    const badges = readyBadges(trainee);

    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-button" + (index === state.current ? " current" : "");
    button.addEventListener("click", function () {
      selectTrainee(index);
    });

    const name = document.createElement("span");
    name.className = "team-name";
    name.textContent = trainee.name;

    const percent = document.createElement("span");
    percent.className = "team-percent";
    percent.textContent = progress.percent + "%";

    const track = document.createElement("div");
    track.className = "progress-track";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = progress.percent + "%";
    track.appendChild(fill);

    const detail = document.createElement("span");
    detail.className = "team-detail";
    detail.textContent = "Day " + dayOfTraining(trainee) + " · " +
      badges.length + " of " + categories.length + " stations ready";

    button.appendChild(name);
    button.appendChild(percent);
    button.appendChild(track);
    button.appendChild(detail);
    item.appendChild(button);
    teamList.appendChild(item);
  });
}

// Fill the dropdown with one option per trainee.
function drawPicker() {
  traineeSelect.innerHTML = "";
  state.trainees.forEach(function (trainee, index) {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = trainee.name;
    traineeSelect.appendChild(option);
  });
  traineeSelect.value = state.current;
  traineeSelect.disabled = state.trainees.length === 0;
}

// The trainee card: name, day of training, progress, badges.
function drawSummary() {
  const trainee = currentTrainee();
  badgesBox.innerHTML = "";
  removeButton.hidden = !trainee;

  if (!trainee) {
    traineeName.textContent = "No trainees yet";
    traineeMeta.textContent = "";
    progressFill.style.width = "0%";
    progressText.textContent = "Add a trainee to start.";
    completeBanner.hidden = true;
    return;
  }

  const progress = countProgress(trainee);
  traineeName.textContent = trainee.name;
  traineeMeta.textContent = "Day " + dayOfTraining(trainee) +
    " of training · started " + niceDate(trainee.started);
  progressFill.style.width = progress.percent + "%";
  progressText.textContent = progress.done + " of " + progress.total +
    " skills covered (" + progress.percent + "%)";
  completeBanner.hidden = progress.percent !== 100;

  readyBadges(trainee).forEach(function (badge) {
    const tag = document.createElement("span");
    tag.className = "badge";
    tag.textContent = "★ " + badge;
    badgesBox.appendChild(tag);
  });
}

// "Cover next shift": the first few skills this trainee has not covered yet,
// in the same order as skills.json (which is the order I train in).
function drawNext() {
  const trainee = currentTrainee();
  nextCard.hidden = !trainee;
  nextList.innerHTML = "";
  nextNote.textContent = "";
  if (!trainee) {
    return;
  }

  const notCovered = [];
  categories.forEach(function (category) {
    category.skills.forEach(function (skill) {
      if (!trainee.done.includes(skill)) {
        notCovered.push({ skill: skill, category: category.name });
      }
    });
  });

  if (notCovered.length === 0) {
    nextNote.textContent = "Every skill is covered. Training is complete.";
    return;
  }

  notCovered.slice(0, NEXT_COUNT).forEach(function (item) {
    const row = document.createElement("li");
    row.textContent = item.skill;

    const tag = document.createElement("span");
    tag.className = "skill-category";
    tag.textContent = item.category;
    row.appendChild(tag);

    if (trainee.notes[item.skill]) {
      const note = document.createElement("span");
      note.className = "next-note-text";
      note.textContent = "Note: " + trainee.notes[item.skill];
      row.appendChild(note);
    }

    nextList.appendChild(row);
  });

  const remaining = notCovered.length - NEXT_COUNT;
  if (remaining > 0) {
    nextNote.textContent = remaining + " more after these.";
  }
}

// One card per category, one row per skill, each with a date and a note.
function drawChecklist() {
  checklist.innerHTML = "";
  const trainee = currentTrainee();
  if (!trainee) {
    return;
  }

  categories.forEach(function (category) {
    const card = document.createElement("section");
    card.className = "card";

    const heading = document.createElement("h2");
    heading.textContent = (category.icon || "☕") + " " + category.name;
    if (categoryComplete(trainee, category)) {
      const ready = document.createElement("span");
      ready.className = "ready-tag";
      ready.textContent = "✓ Ready";
      heading.appendChild(ready);
    }
    card.appendChild(heading);

    category.skills.forEach(function (skill) {
      card.appendChild(drawSkillRow(trainee, skill));
    });

    checklist.appendChild(card);
  });
}

function drawSkillRow(trainee, skill) {
  const covered = trainee.done.includes(skill);
  const note = trainee.notes[skill];

  const row = document.createElement("div");
  row.className = "skill-row" + (covered ? " done" : "");

  // The checkbox and skill name
  const label = document.createElement("label");
  label.className = "skill";

  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = covered;
  box.addEventListener("change", function () {
    setSkill(trainee, skill, box.checked);
  });

  const text = document.createElement("span");
  const name = document.createElement("span");
  name.className = "skill-name";
  name.textContent = skill;
  text.appendChild(name);

  if (covered && trainee.dates[skill]) {
    const date = document.createElement("span");
    date.className = "skill-date";
    date.textContent = "Covered " + niceDate(trainee.dates[skill]);
    text.appendChild(date);
  }

  label.appendChild(box);
  label.appendChild(text);
  row.appendChild(label);

  // The note button: ✎ to add a note, 📝 when there is one
  const noteButton = document.createElement("button");
  noteButton.type = "button";
  noteButton.className = "note-button";
  noteButton.textContent = note ? "📝" : "✎";
  noteButton.setAttribute("aria-label", (note ? "Edit" : "Add") + " a note for " + skill);
  noteButton.addEventListener("click", function () {
    openNote = openNote === skill ? null : skill;
    drawChecklist();
    const input = checklist.querySelector(".note-input");
    if (input) {
      input.focus();
    }
  });
  row.appendChild(noteButton);

  if (openNote === skill) {
    // The note box: saves when the trainer presses Enter or taps away
    const input = document.createElement("input");
    input.type = "text";
    input.className = "note-input";
    input.placeholder = "e.g. needs more practice on latte art";
    input.setAttribute("aria-label", "Note for " + skill);
    input.value = note || "";
    input.addEventListener("change", function () {
      setNote(trainee, skill, input.value);
    });
    row.appendChild(input);
  } else if (note) {
    const noteText = document.createElement("p");
    noteText.className = "note-text";
    noteText.textContent = note;
    row.appendChild(noteText);
  }

  return row;
}

// Falling coffee beans and stars, cleared after a few seconds.
function celebrate() {
  const pieces = ["☕", "🎉", "⭐", "🫘"];
  for (let i = 0; i < 30; i = i + 1) {
    const piece = document.createElement("span");
    piece.textContent = pieces[i % pieces.length];
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.animationDelay = Math.random() * 0.8 + "s";
    confetti.appendChild(piece);
  }
  setTimeout(function () {
    confetti.innerHTML = "";
  }, 3500);
}
