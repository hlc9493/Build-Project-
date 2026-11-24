// Processing layer: loads the skills, draws the screens, scores progress.
// Milestone 2: several trainees, saved in this browser.
// Milestone 3: a "next shift" list, and a way to remove a trainee.
// Upgrade: team overview, station-ready badges, dates and notes, celebration.
// Feedback round: ratings instead of checkboxes, how-to-teach instructions,
// and a single clear first step when there are no trainees.

const STORAGE_KEY = "trainingTracker";
const NEXT_COUNT = 3;     // how many skills to suggest for the next shift

// The rating scale. Level 0 means the skill has not been shown yet.
const LEVELS = ["Not yet", "Shown", "Practicing", "Confident"];
const TOP = LEVELS.length - 1;

const checklist = document.getElementById("checklist");
const welcome = document.getElementById("welcome");
const picker = document.getElementById("picker");
const traineeSelect = document.getElementById("trainee-select");
const addForm = document.getElementById("add-form");
const newName = document.getElementById("new-name");
const summaryCard = document.getElementById("summary-card");
const traineeName = document.getElementById("trainee-name");
const traineeMeta = document.getElementById("trainee-meta");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const levelCounts = document.getElementById("level-counts");
const badgesBox = document.getElementById("badges");
const completeBanner = document.getElementById("complete-banner");
const removeButton = document.getElementById("remove-button");
const nextCard = document.getElementById("next-card");
const nextList = document.getElementById("next-list");
const nextNote = document.getElementById("next-note");
const teamCard = document.getElementById("team-card");
const teamList = document.getElementById("team-list");
const loadError = document.getElementById("load-error");
const confetti = document.getElementById("confetti");

let categories = [];      // filled in from skills.json
let state = loadState();  // the trainees and how far along each one is
let openNote = null;      // the skill whose note box is open, if any

// Draw the empty-state screen right away, before the skills arrive.
drawEverything();

// Data layer, part 1: the skills (and how to teach each one) live in skills.json.
fetch("skills.json")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    categories = data.categories.map(function (category) {
      return {
        name: category.name,
        icon: category.icon,
        badge: category.badge,
        // A skill can be plain text, or { "name": ..., "how": ... }
        skills: category.skills.map(function (skill) {
          return typeof skill === "string" ? { name: skill, how: "" } : skill;
        })
      };
    });
    drawEverything();
  })
  .catch(function () {
    loadError.hidden = false;
  });

// Data layer, part 2: trainee progress lives in this browser's localStorage.
// Each trainee looks like:
// { name: "Sam", started: "2026-11-19",
//   levels: { "Steams milk": 2 },              0 to 3, see LEVELS
//   dates:  { "Steams milk": "2026-11-20" },   when the rating last changed
//   notes:  { "Steams milk": "needs practice on foam" } }
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

  loaded.trainees.forEach(function (trainee) {
    trainee.levels = trainee.levels || {};
    trainee.dates = trainee.dates || {};
    trainee.notes = trainee.notes || {};
    trainee.started = trainee.started || today();
    // Older versions used checkboxes: a ticked skill becomes "Shown".
    if (trainee.done) {
      trainee.done.forEach(function (skill) {
        if (!trainee.levels[skill]) {
          trainee.levels[skill] = 1;
        }
      });
      delete trainee.done;
    }
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

function levelOf(trainee, skillName) {
  return trainee.levels[skillName] || 0;
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

// ---------- Scoring ----------

// The training score: every skill is worth 3 points (Confident),
// so the score is how much of the full 3-points-per-skill is earned.
function score(trainee) {
  let points = 0;
  let total = 0;
  const counts = [0, 0, 0, 0];
  categories.forEach(function (category) {
    category.skills.forEach(function (skill) {
      const level = levelOf(trainee, skill.name);
      points = points + level;
      total = total + 1;
      counts[level] = counts[level] + 1;
    });
  });
  const percent = total === 0 ? 0 : Math.round((points / (total * TOP)) * 100);
  return { percent: percent, total: total, counts: counts };
}

// A station is ready only when every skill in it is Confident.
function stationReady(trainee, category) {
  return category.skills.every(function (skill) {
    return levelOf(trainee, skill.name) === TOP;
  });
}

// The badge text can be set in skills.json; otherwise it is made from the name.
function badgeName(category) {
  return category.badge || category.name + " ready";
}

function readyBadges(trainee) {
  return categories
    .filter(function (category) {
      return stationReady(trainee, category);
    })
    .map(badgeName);
}

// ---------- Actions ----------

// Adding a trainee: put them on the list, switch to them, save.
addForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = newName.value.trim();
  if (name === "") {
    newName.focus();
    return;
  }
  state.trainees.push({ name: name, started: today(), levels: {}, dates: {}, notes: {} });
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

// Rating a skill. Tapping the rating it already has steps it back to "Not yet",
// so a mis-tap is easy to undo.
function rateSkill(trainee, skillName, level) {
  const wasComplete = score(trainee).percent === 100;

  if (levelOf(trainee, skillName) === level) {
    level = 0;
  }
  if (level === 0) {
    delete trainee.levels[skillName];
    delete trainee.dates[skillName];
  } else {
    trainee.levels[skillName] = level;
    trainee.dates[skillName] = today();
  }
  saveState();
  drawEverything();

  if (!wasComplete && score(trainee).percent === 100) {
    celebrate();
  }
}

function setNote(trainee, skillName, text) {
  const note = text.trim();
  if (note === "") {
    delete trainee.notes[skillName];
  } else {
    trainee.notes[skillName] = note;
  }
  openNote = null;
  saveState();
  drawEverything();
}

// ---------- Drawing ----------

function drawEverything() {
  drawStart();
  drawTeam();
  drawSummary();
  drawNext();
  drawChecklist();
}

// With no trainees, show only the welcome message and the add form.
function drawStart() {
  const empty = state.trainees.length === 0;
  welcome.hidden = !empty;
  picker.hidden = empty;

  traineeSelect.innerHTML = "";
  state.trainees.forEach(function (trainee, index) {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = trainee.name;
    traineeSelect.appendChild(option);
  });
  traineeSelect.value = state.current;
}

// Team overview: one row per trainee; tapping a row opens that trainee.
function drawTeam() {
  teamList.innerHTML = "";
  teamCard.hidden = state.trainees.length === 0;

  state.trainees.forEach(function (trainee, index) {
    const result = score(trainee);
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
    percent.textContent = result.percent + "%";

    const track = document.createElement("div");
    track.className = "progress-track";
    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = result.percent + "%";
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

// The trainee card: name, day of training, score, level counts, badges.
function drawSummary() {
  const trainee = currentTrainee();
  summaryCard.hidden = !trainee;
  badgesBox.innerHTML = "";
  if (!trainee) {
    return;
  }

  const result = score(trainee);
  traineeName.textContent = trainee.name;
  traineeMeta.textContent = "Day " + dayOfTraining(trainee) +
    " of training · started " + niceDate(trainee.started);
  progressFill.style.width = result.percent + "%";
  progressText.textContent = "Training score: " + result.percent + "%";
  levelCounts.textContent =
    result.counts[3] + " confident · " +
    result.counts[2] + " practicing · " +
    result.counts[1] + " shown · " +
    result.counts[0] + " not yet";
  completeBanner.hidden = result.percent !== 100;

  readyBadges(trainee).forEach(function (badge) {
    const tag = document.createElement("span");
    tag.className = "badge";
    tag.textContent = "★ " + badge;
    badgesBox.appendChild(tag);
  });
}

// "Work on next shift": the skills furthest from Confident, lowest level first.
// Within a level, skills keep the skills.json order (the order I train in).
function drawNext() {
  const trainee = currentTrainee();
  nextCard.hidden = !trainee || categories.length === 0;
  nextList.innerHTML = "";
  nextNote.textContent = "";
  if (nextCard.hidden) {
    return;
  }

  const toWorkOn = [];
  categories.forEach(function (category) {
    category.skills.forEach(function (skill) {
      const level = levelOf(trainee, skill.name);
      if (level < TOP) {
        toWorkOn.push({ skill: skill.name, category: category.name, level: level });
      }
    });
  });
  // Array sort keeps equal items in their original order.
  toWorkOn.sort(function (a, b) {
    return a.level - b.level;
  });

  if (toWorkOn.length === 0) {
    nextNote.textContent = "Confident on every skill. Training is complete.";
    return;
  }

  toWorkOn.slice(0, NEXT_COUNT).forEach(function (item) {
    const row = document.createElement("li");
    row.textContent = item.skill;

    const tag = document.createElement("span");
    tag.className = "skill-category";
    tag.textContent = item.category + " · " + LEVELS[item.level];
    row.appendChild(tag);

    if (trainee.notes[item.skill]) {
      const note = document.createElement("span");
      note.className = "next-note-text";
      note.textContent = "Note: " + trainee.notes[item.skill];
      row.appendChild(note);
    }

    nextList.appendChild(row);
  });

  const remaining = toWorkOn.length - NEXT_COUNT;
  if (remaining > 0) {
    nextNote.textContent = remaining + " more skills still to reach Confident.";
  }
}

// One card per category, one row per skill.
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
    heading.appendChild(makeIcon(category.icon));
    heading.appendChild(document.createTextNode(category.name));
    if (stationReady(trainee, category)) {
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
  const level = levelOf(trainee, skill.name);
  const note = trainee.notes[skill.name];

  const row = document.createElement("div");
  row.className = "skill-row level-" + level;

  // Skill name, plus its rating and date once it has one
  const text = document.createElement("div");
  text.className = "skill-text";
  const name = document.createElement("span");
  name.className = "skill-name";
  name.textContent = skill.name;
  text.appendChild(name);

  const status = document.createElement("span");
  status.className = "skill-status";
  status.textContent = level === 0
    ? "Not yet"
    : LEVELS[level] + " · " + niceDate(trainee.dates[skill.name] || today());
  text.appendChild(status);
  row.appendChild(text);

  // The note button: ✎ to add a note, 📝 when there is one
  const noteButton = document.createElement("button");
  noteButton.type = "button";
  noteButton.className = "note-button";
  noteButton.textContent = note ? "📝" : "✎";
  noteButton.setAttribute("aria-label", (note ? "Edit" : "Add") + " a note for " + skill.name);
  noteButton.addEventListener("click", function () {
    openNote = openNote === skill.name ? null : skill.name;
    drawChecklist();
    const input = checklist.querySelector(".note-input");
    if (input) {
      input.focus();
    }
  });
  row.appendChild(noteButton);

  // The rating buttons: Shown, Practicing, Confident
  const rating = document.createElement("div");
  rating.className = "rating";
  rating.setAttribute("role", "group");
  rating.setAttribute("aria-label", "Rating for " + skill.name);
  for (let value = 1; value <= TOP; value = value + 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rate rate-" + value;
    button.textContent = LEVELS[value];
    button.setAttribute("aria-pressed", level === value ? "true" : "false");
    button.addEventListener("click", function () {
      rateSkill(trainee, skill.name, value);
    });
    rating.appendChild(button);
  }
  row.appendChild(rating);

  // How to teach it, from skills.json (tap to open)
  if (skill.how) {
    const how = document.createElement("details");
    how.className = "how";
    const summary = document.createElement("summary");
    summary.textContent = "How to teach it";
    const steps = document.createElement("p");
    steps.textContent = skill.how;
    how.appendChild(summary);
    how.appendChild(steps);
    row.appendChild(how);
  }

  if (openNote === skill.name) {
    // The note box: saves when the trainer presses Enter or taps away
    const input = document.createElement("input");
    input.type = "text";
    input.className = "note-input";
    input.placeholder = "e.g. needs more practice on milk texture";
    input.setAttribute("aria-label", "Note for " + skill.name);
    input.value = note || "";
    input.addEventListener("change", function () {
      setNote(trainee, skill.name, input.value);
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

// A category icon from skills.json: an image file such as "images/cup.png",
// or an emoji. With no icon set, it uses a coffee cup.
function makeIcon(icon) {
  icon = icon || "☕";
  if (/\.(png|gif|svg|jpe?g|webp)$/i.test(icon)) {
    const image = document.createElement("img");
    image.className = "category-icon";
    image.src = icon;
    image.alt = "";
    return image;
  }
  const emoji = document.createElement("span");
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = icon;
  return emoji;
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
