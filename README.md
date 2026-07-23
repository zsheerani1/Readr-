# Readr

Readr is a reading tracker web application for people who love books but lose track of them. It lets readers build a personal library by searching the Google Books API — autofilling titles, authors, page counts, and cover art — then track their progress page by page, rate the books they finish, and set monthly and yearly reading goals with visual progress indicators. Everything is saved in the browser, so there are no accounts, no sign-ups; just a clean, fast way for casual readers to see what they're reading, what's next, and how close they are to their reading goals.

**Live site:** https://zsheerani1.github.io/Readr-/

![Readr dashboard on desktop](docs/screenshots/hero.png)

---

## Table of Contents

1. [Purpose & Target Audience](#1-purpose--target-audience)
2. [User Stories](#2-user-stories)
3. [UX Design](#3-ux-design)
4. [Features](#4-features)
5. [Technologies Used](#5-technologies-used)
6. [Testing](#6-testing)
7. [Deployment](#7-deployment)
8. [Credits & Attribution](#8-credits--attribution)
9. [Acknowledgements](#9-acknowledgements)

---

## 1. Purpose & Target Audience

### 1.1 Purpose

[2–3 sentences on the problem Readr solves and why the alternatives fall short.]

### 1.2 Target Audience

[Describe your audience concretely — who they are and what they need.]

### 1.3 Rationale

[Why you built this project, and why a front-end web app with an external API
is the right solution for that audience.]

---

## 2. User Stories

**First-time visitor:**

- **US1:** As a first-time visitor, I want to understand what the site does
  immediately, so that I can decide whether it is useful to me.
- **US2:** As a first-time visitor, I want to add my first book quickly, so
  that I can start using the app without setup.

**Returning reader:**

- **US3:** As a reader, I want to search for a book by title, author, or ISBN,
  so that I can add it without typing the details manually.
- **US4:** As a reader, I want to record my current page, so that I can see my
  progress through each book.
- **US5:** As a reader, I want to set monthly and yearly reading goals, so
  that I can stay motivated.
- **US6:** As a reader, I want to filter and search my library, so that I can
  find a specific book quickly.
- **US7:** As a reader, I want to rate books I have finished, so that I can
  remember which ones I enjoyed.
- **US8:** As a reader, I want my library to be saved between visits, so that
  I do not lose my data when I close the browser.
- **US9:** As a reader, I want to use the app comfortably on my phone, so that
  I can update progress while reading in bed.
- **US10:** As a reader, I want the option of a dark theme, so that the app is
  comfortable to use at night.

---

## 3. UX Design

### 3.1 Design Process

[Describe how you designed the app. Embed wireframes stored in `docs/wireframes/`.]

![Wireframe — dashboard](docs/wireframes/dashboard.png)
![Wireframe — add book modal](docs/wireframes/add-book-modal.png)

[Note anything that changed between wireframe and final build, and why.]

### 3.2 Information Hierarchy & Navigation

[Explain the page structure, the order information is presented in, and the
sidebar navigation.]

### 3.3 Colour, Typography & Imagery

[Palette with hex values, fonts and why, book covers as imagery, how the
light/dark themes adapt.]

### 3.4 Accessibility

- Semantic HTML landmarks (`header`, `nav`, `main`, `section`)
- Labels linked to every form input; visually hidden (`sr-only`) labels where
  a visible label would clutter the design
- `aria-label` on icon-only buttons (theme toggle, close, delete)
- `aria-live` status region announcing search results and errors
- Keyboard support: modals trap focus, close on Escape, and return focus to
  the opening element; carousel responds to arrow keys
- Colour contrast checked in both themes
- `role="progressbar"` with current values on all progress bars

### 3.5 Design Decisions & Deviations

[Justify any deviations from convention, or state that none were made.]

---

## 4. Features

### 4.1 Existing Features

#### Dashboard & Reading Goals

[Description and the feedback the user receives.]

![Dashboard](docs/screenshots/dashboard.png)

#### Add a Book (Google Books search)

[Description — debounced search, results with covers, autofill, manual
fallback, validation, confirmation toast.]

![Add book modal](docs/screenshots/add-book.png)

#### Your Library (list, filter, search)

[Description — cards, filter pills, live search, empty states.]

![Library](docs/screenshots/library.png)

#### Reading Progress & Status

[Description — page input, automatic status changes, finish dates.]

#### Star Ratings

[Description — 1–5 rating, click current rating to clear, dashboard average.]

#### Carousel Shelf

[Description — scrolling shelf, arrow buttons, keyboard support.]

#### Dark / Light Theme

[Description — system preference, manual toggle, persistence.]

#### Persistence

[Description — localStorage for library, goals, and theme; graceful recovery
from invalid or unavailable storage.]

### 4.2 Future Features

- [e.g. Cross-device sync via a backend]
- [e.g. Reading streak tracking]
- [e.g. Export library as CSV]

---

## 5. Technologies Used

- **HTML5** — semantic page structure
- **CSS3** — custom properties, Grid and Flexbox, theming, responsive design
- **JavaScript (ES6+)** — all interactivity; no frameworks
- **[Google Books API](https://developers.google.com/books)** — book search,
  metadata, and cover images
- **[Jest](https://jestjs.io/)** — automated unit testing
- **Node.js / npm** — development dependencies only; the app runs with no
  build step
- **Git & GitHub** — version control
- **GitHub Pages** — deployment
- **VS Code** — editor
- **[W3C Markup Validator](https://validator.w3.org/),
  [W3C Jigsaw](https://jigsaw.w3.org/css-validator/), ESLint** — validation

---

## 6. Testing

### 6.1 Testing Principles: Manual vs Automated

[In your own words: what manual testing is, what automated testing is, the
strengths of each, when each is best deployed, and the split you chose for
this project and why.]

### 6.2 Automated Testing (Jest)

Unit tests cover the pure utility functions in `assets/js/utils.js`:

| Test file | Function under test | What is verified |
|---|---|---|
| `utils.test.js` | `secureUrl()` | `http://` cover URLs are upgraded to `https://`; empty input returns `''` |
| `utils.test.js` | `formatStatus()` | Known statuses map to display labels; unknown statuses fall through unchanged |
| `utils.test.js` | `generateId()` | Two consecutive calls return different values |

**Running the tests:**

```bash
npm install
npm test
```

![All Jest tests passing](docs/testing/jest-passing.png)

[State which parts are not unit-tested (DOM rendering, event handling) and
that these are covered by the manual procedures below.]

### 6.3 Manual Testing Procedure & Results

| # | User story | Feature | Test action | Expected result | Actual result | Pass |
|---|---|---|---|---|---|---|
| T1 | US3 | Book search | Type "harry potter" in Add Book search | Results with covers appear after a short pause | | |
| T2 | US3 | Book search | Type a single character | No search fires; no results shown | | |
| T3 | US3 | Book search (failure) | Disconnect network, search | "Search unavailable" message; manual entry still works | | |
| T4 | US2 | Validation | Submit the form with an empty title | "Title is required." shown; book not added | | |
| T5 | US2 | Validation | Enter 0 or a negative page count | "Enter a valid number of pages." shown | | |
| T6 | US4 | Progress | Set current page equal to total pages | Status changes to Finished automatically | | |
| T7 | US4 | Progress | Enter a page number above the total | Value capped at total pages | | |
| T8 | US5 | Goals | Enter an invalid goal (0, blank, text) | Inline error; goal unchanged | | |
| T9 | US6 | Filtering | Click each filter pill | Only books with that status shown; active pill highlighted | | |
| T10 | US8 | Persistence | Add a book, refresh the page | Book still present | | |
| T11 | US10 | Theme | Toggle theme, refresh | Chosen theme persists | | |
| T12 | US1 | Navigation | Visit an invalid hash / URL | Redirected to the main page | | |
| T13 | — | Console | Perform all of the above with DevTools open | No errors in the console | | |

### 6.4 Responsiveness Testing

| Device / width | Browser | Result |
|---|---|---|
| iPhone SE (375px) | Safari | |
| iPad (768px) | Safari | |
| Desktop (1440px) | Chrome | |
| Desktop (1440px) | Firefox | |

[Include screenshots at each size in `docs/testing/`.]

### 6.5 Code Validation

| Validator | File(s) | Result |
|---|---|---|
| W3C Markup Validator | `index.html` | [No errors — screenshot](docs/testing/w3c-html.png) |
| W3C Jigsaw | `index.css` | [No errors — screenshot](docs/testing/jigsaw-css.png) |
| ESLint / JSLint | `assets/js/*.js` | [No major issues — screenshot](docs/testing/lint.png) |

### 6.6 Testing During Development

[Describe your ongoing routine: browser-testing each feature as built,
checking the console after user actions, running `npm test` before commits,
and after each deployment hard-refreshing the live site and running a smoke
test to confirm the deployed version matches development. Evidence in
`docs/testing/`.]

### 6.7 Bugs

**Fixed:**

| Bug | Cause | Fix |
|---|---|---|
| Theme toggle stopped working after adding an emoji button | Two elements shared `id="theme-toggle"`; `getElementById` attached the listener to the first only | Removed the duplicate so exactly one element owns the id |
| Title/Author fields misaligned in the Add Book modal | Grid cells of unequal height were vertically centred; error spans reserved inconsistent space | `align-items: start` on the form grid and a consistent `min-height` on error messages |
| `favicon.ico` 404 in the console on every page load | No favicon provided | Added a favicon and linked it in the head |

**Known / unfixed:**

[List honestly with an explanation, or state that no known bugs remain.]

---

## 7. Deployment

### 7.1 Deploying to GitHub Pages

1. On the repository page, go to **Settings → Pages**.
2. Under **Source**, select **Deploy from a branch**.
3. Select the **main** branch and the **/ (root)** folder, then **Save**.
4. Wait 1–2 minutes; the live URL appears at the top of the Pages settings.
5. Verify the live site loads and matches the development version.

The live site is available at:
[https://YOUR-USERNAME.github.io/Readr/](https://YOUR-USERNAME.github.io/Readr/)

### 7.2 Running the Project Locally

1. Clone the repository:
```bash
   git clone https://github.com/YOUR-USERNAME/Readr.git
   cd Readr
```
   (or download the ZIP from the green **Code** button and unzip it)
2. Open `index.html` directly in a browser, **or** serve it locally:
```bash
   python3 -m http.server 8000
```
   and visit `http://localhost:8000`.
3. To run the automated tests:
```bash
   npm install
   npm test
```

---

## 8. Credits & Attribution

### Code

- [Attribute code adapted from external sources — tutorials, articles,
  documentation — with a link and where it is used. Mirror each attribution
  in a comment above the relevant code.]
- [AI assistance: disclose here in accordance with the course's policy on AI
  tools, describing which parts of the project it contributed to.]

### Content & Media

- Book metadata and cover images are provided by the
  [Google Books API](https://developers.google.com/books).
- Icons are custom inline SVGs in the style of
  [Lucide](https://lucide.dev/) / [Feather](https://feathericons.com/).
- Fonts from [Google Fonts](https://fonts.google.com/): [list them].

---

## 9. Acknowledgements

- [Your tutor / mentor]
- [Friends or family who user-tested the app]
