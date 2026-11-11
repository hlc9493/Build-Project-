// Processing layer: loads the skills, draws the checklist, counts progress.
// Milestone 1: one trainee, nothing is saved yet (a refresh clears the ticks).

const checklist = document.getElementById("checklist");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

// Data layer: the list of skills lives in skills.json, not in this code.
fetch("skills.json")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    drawChecklist(data.categories);
    updateProgress();
  })
  .catch(function () {
    progressText.textContent =
      "Could not load skills.json. Open the app from its GitHub Pages link.";
    progressText.className = "error";
  });

// Build one card per category, with one checkbox per skill.
function drawChecklist(categories) {
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
      box.addEventListener("change", function () {
        row.classList.toggle("done", box.checked);
        updateProgress();
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

// Count the ticked boxes and update the bar and the sentence under it.
function updateProgress() {
  const boxes = checklist.querySelectorAll("input[type=checkbox]");
  const total = boxes.length;
  let done = 0;
  boxes.forEach(function (box) {
    if (box.checked) {
      done = done + 1;
    }
  });

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  progressFill.style.width = percent + "%";
  progressText.textContent =
    done + " of " + total + " skills covered (" + percent + "%)";
}
