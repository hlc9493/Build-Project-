// Processing layer: loads the skills, draws the checklist, counts progress.
// Milestone 2: several trainees, and every tick is saved in this browser.
// Milestone 3: a "Cover next shift" list, and a way to remove a trainee.

const STORAGE_KEY = "trainingTracker";

const checklist = document.getElementById("checklist");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const traineeName = document.getElementById("trainee-name");
const traineeSelect = document.getElementById("trainee-select");
const addForm = document.getElementById("add-form");
const newName = document.getElementById("new-name");
const removeButton = document.getElementById("remove-button");
const nextCard = document.getElementById("next-card");
const nextList = document.getElementById("next-list");
const nextNote = document.getElementById("next-note");

const NEXT_COUNT = 3;     // how many skills to suggest for the next shift

let categories = [];      // filled in from skills.json
let state = loadState();  // the trainees and what each one has covered

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
// It looks like: { trainees: [ { name: "Sam", done: ["Steams milk"] } ], current: 0 }
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    // Storage is blocked or the saved text is broken: start fresh.
  }
  return { trainees: [], current: 0 };
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

// Adding a trainee: put them on the list, switch to them, save.
addForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = newName.value.trim();
  if (name === "") {
    return;
  }
  state.trainees.push({ name: name, done: [] });
  state.current = state.trainees.length - 1;
  saveState();
  newName.value = "";
  drawEverything();
});

// Switching trainee: remember who is selected, then redraw.
traineeSelect.addEventListener("change", function () {
  state.current = Number(traineeSelect.value);
  saveState();
  drawEverything();
});

// Removing a trainee: ask first, because their progress goes with them.
removeButton.addEventListener("click", function () {
  const trainee = currentTrainee();
  if (!trainee) {
    return;
  }
  if (window.confirm("Remove " + trainee.name + " and their progress?")) {
    state.trainees.splice(state.current, 1);
    state.current = 0;
    saveState();
    drawEverything();
  }
});

function drawEverything() {
  drawPicker();
  drawChecklist();
  updateProgress();
  drawNext();
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

  const trainee = currentTrainee();
  traineeName.textContent = trainee ? trainee.name : "No trainees yet";
  removeButton.hidden = !trainee;
}

// Build one card per category, with one checkbox per skill.
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
    heading.textContent = category.name;
    card.appendChild(heading);

    category.skills.forEach(function (skill) {
      const row = document.createElement("label");
      row.className = "skill";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = trainee.done.includes(skill);
      row.classList.toggle("done", box.checked);

      box.addEventListener("change", function () {
        if (box.checked) {
          trainee.done.push(skill);
        } else {
          trainee.done = trainee.done.filter(function (item) {
            return item !== skill;
          });
        }
        saveState();
        row.classList.toggle("done", box.checked);
        updateProgress();
        drawNext();
      });

      const text = document.createElement("span");
      text.textContent = skill;

      row.appendChild(box);
      row.appendChild(text);
      card.appendChild(row);
    });

    checklist.appendChild(card);
  });
}

// Count the covered skills and update the bar and the sentence under it.
function updateProgress() {
  const trainee = currentTrainee();
  if (!trainee) {
    progressFill.style.width = "0%";
    progressText.textContent = "Add a trainee to start.";
    return;
  }

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
  progressFill.style.width = percent + "%";
  progressText.textContent =
    done + " of " + total + " skills covered (" + percent + "%)";
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

    nextList.appendChild(row);
  });

  const remaining = notCovered.length - NEXT_COUNT;
  if (remaining > 0) {
    nextNote.textContent = remaining + " more after these.";
  }
}
