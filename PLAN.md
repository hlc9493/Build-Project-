# Build plan: Barista Training Tracker

MGIS 130 Build Project · Web-App Track · Hannah Curran

**Live app:** https://hlc9493.github.io/Build-Project-/

## The problem

At a busy coffee shop, a trainer has no quick way to see which skills a new
barista has been trained on, or how well they can actually do each one. Shifts
get spent re-teaching some skills while others are missed, and new hires can
end up on a station before they are ready.

- **Who hurts:** the trainer (me), the new hire, and the shift supervisor who
  has to decide where a new hire can safely work.
- **What it costs:** training time that is paid but wasted, and new hires put
  on a station before they are ready. 
- **How it works today:** a notebook and course on an iPad, but not an efficient one
- **Why this solution:** one screen per trainee that shows how confident they
  are on each skill, which stations they are ready for, and what to work on
  next shift.

## Scope

**In:** a rating for each skill (Shown, Practicing, Confident), a training
score, station-ready badges, a team overview, dates and notes on each skill,
"how to teach it" instructions, and a "work on next shift" list. Saved on the
trainer's device, and fits both phone and computer screens.

**Out (on purpose):** logins, sharing between devices and real employee
records. Those need a server. The app runs on one device and uses first names
or made-up names only, so no personal data goes in the repo.

## Milestones

| # | Milestone | Planned | Finished | Done looks like |
|---|-----------|---------|----------|-----------------|
| 1 | One trainee's checklist works | Thu Nov 12 | Nov 13 | Skills load from `skills.json`, ticking one moves the progress bar, live on GitHub Pages |
| 2 | Several trainees, and it saves | Sun Nov 15 | Nov 13 | Add a trainee, switch between them, a refresh keeps every tick |
| 3 | "Next shift" view, phone ready | Tue Nov 17 | Nov 13 | Shows the next 3 skills to cover; no sideways scrolling at phone width |
| 3b | Added features | Not in original plan | Nov 19 | Team overview, station badges, dates and notes, coffee theme, layout for computer screens |
| 3c | Professor feedback changes | Not in original plan | Ratings instead of checkboxes, "how to teach it" instructions, one clear first step for a new user |
| 4 | Improvement measured, documents written | Thu Nov 19, moved to Tue Nov 24 | Before and after timing recorded; README and reflection finished |
| – | Submit on myCourses | Fri Nov 20, moved to Tue Nov 24 | Link, plan, status updates and reflection uploaded |

The due date moved from Nov 20 to Nov 24 when my professor extended it.

## First three tasks

| Task | By | Done looks like |
| Commit this plan to the Build repo | Wed Nov 11 | `PLAN.md` is in the repo |
| Commit the first screen and turn on GitHub Pages | Thu Nov 12 | The live link shows the checklist |
| Replace the sample skills with my real training list | Thu Nov 12 | `skills.json` matches how I train, in my own words |

## Critical path

Skills load from the data file → ratings save and survive a refresh → the
"work on next shift" view. Each step depends on the one before it. Styling,
badges, the team overview and the computer layout had slack: they were added
after the core worked, so they could slip without making the Build late.

## Status updates

### Status update 1 (Oct 30 studio)



### Status update 2 (week 12, Nov 13)

- **Done:** Milestones 1 to 3. The checklist loads from `skills.json`,
  several trainees can be added, switched and removed, ticks survive a
  refresh, and the "cover next shift" view works. Live on GitHub Pages.
- **Next:** Measure the improvement, write the README and reflection.
- **Blocked:** Nothing. One GitHub Pages deployment failed on Nov 13; re-running
  it from the Actions tab fixed it. Known limit: progress saves on one device
  only, because sharing would need a server.

### Status update 3 (Nov 20, after professor feedback)

- **Done:** Added a team overview, station-ready badges, dates and notes, a
  coffee-shop theme and a two-column layout for computer screens (Nov 19).
  Asked my professor for feedback by email.
- **Feedback received:** hide the trainee dropdown when there are no
  trainees, so a new user has one clear path; use ratings instead of
  checkboxes to track quality, not just completion; optionally add
  instructions for each task.
- **Next:** Make all three changes, then finish the measurement, README and
  reflection by the new due date, Tue Nov 24.
- **Blocked:** Nothing.

## Measuring the improvement

Question timed: "What has this trainee not been trained on yet, and what
should they work on next?" Timed for three trainees with my old method and
three with the app.

