# Build-Project-
# Barista Training Tracker

**Live app:** https://hlc9493.github.io/Build-Project-/

MGIS 130 Build Project · Web-App Track · Hannah Curran · Fall 2026

## The problem

A trainer at a busy coffee shop has no quick way to see which skills a new
barista has been trained on, or how well they can do each one. Shifts get
spent re-teaching some skills while others are missed, and supervisors can't
easily tell which stations a new hire is ready for.

## What it does

- **Rates each skill** as Shown, Practicing or Confident, so it tracks quality,
  not just whether a skill was covered
- **Training score** for each trainee, with a count of skills at each level
- **Station-ready badges**, such as "Bar ready", once every skill at a station
  is Confident
- **Team overview** showing every trainee's score, day of training and stations
  ready, for the supervisor
- **Work on next shift**: the three skills furthest from Confident, in the order
  they are taught
- **How to teach it**: step-by-step instructions for each skill, so training is
  consistent
- **Dates and notes** on each skill, such as "needs practice on milk texture"
- Fits both **phone and computer screens**, and saves everything in the browser

## How to use it

1. Open the live link on the trainer's phone, tablet or computer.
2. Type a trainee's first name and tap **Add trainee**.
3. During a shift, tap **Shown**, **Practicing** or **Confident** on each skill
   as the trainee progresses. Tap the selected rating again to undo it.
4. Tap **How to teach it** under a skill for the teaching steps, and the ✎
   button to add a note.
5. Before the next shift, check **Work on next shift** to see what to focus on.
6. Use the team overview or the dropdown to switch trainees. **Remove this
   trainee** clears one when their training is finished.

## How it works

The app has the three layers from class, all running in the browser:

| Layer | File | Job |
|-------|------|-----|
| Presentation | `index.html`, `style.css` | What the trainer sees and taps, on phone or computer |
| Processing | `app.js` | Draws the screens, scores each trainee, picks the next skills |
| Data | `skills.json` + browser `localStorage` | The skills and teaching steps, and each trainee's saved ratings |

**Scoring:** each skill is worth up to 3 points (Shown 1, Practicing 2,
Confident 3). The training score is the points earned out of the points
possible.

**Changing the skills:** edit `skills.json`. Each skill has a `name` and a
`how` (the teaching steps). Each category can have an `icon` and a `badge`.
The "work on next shift" list follows the order of this file.

## Measured improvement

Question timed: "What has this trainee not been trained on yet, and what
should they work on next?"

| Method | Average time (3 trainees) |
|--------|---------------------------|
| Before: Starbucks Course | 1-2 hours|
| After: this app | 5-10 minutes |

Changes from feedback
After professor feedback on Nov 20:
A new user sees one clear first step, "Add your first trainee", instead of an empty dropdown.
Checkboxes became ratings, so the app tracks how well a skill is done, not just whether it was covered.
Each skill now has "how to teach it" instructions.
Limits and privacy
Progress is saved on one device only. A second trainer's phone won't see it; sharing between devices would need a server, which is outside this project's scope.
No logins, no server and no cost: it runs on GitHub Pages' free tier.
Trainee names stay in the trainer's browser and never go into this repo. Use first names or made-up names only.
Credits
Coffee equipment icons (mug, to-go cup, portafilter, kettle): [Hannah: name of the set] by [artist], from [site and link]
Croissant icon: [Hannah: name of the set] by [artist], from [site and link]
Project documents
PLAN.md: problem, milestones, critical path, status updates and timing
Reflection and AI critique: submitted on myCourses
