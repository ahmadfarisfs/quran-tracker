# Quran Khatam Tracker — متابعة ختم القرآن الكريم

A lightweight, installable Progressive Web App (PWA) to help you complete (*khatam*) the Holy Quran on a personalised schedule. No account or internet needed after the first load — everything runs in your browser.

**Live app → [https://ahmadfarisfs.github.io/quran-tracker/](https://ahmadfarisfs.github.io/quran-tracker/)**

---

## Features

### Goal Setting
- **Set target in days** — type how many days you want to finish in (e.g. 30 days, 7 days)
- **Set target by date** — pick a calendar date and the app calculates the days remaining automatically
- **Optional starting position** — choose any Surah and Ayat if you're continuing a previous reading, rather than starting from Al-Fatihah

### Daily Schedule
- Reading is divided evenly across **5 daily prayer sessions**: Fajr, Dhuhr, Asr, Maghrib, Isha
- Each session shows the exact **Surah name (Arabic + English) and Ayat range** (start → end)
- The **current prayer session** is auto-highlighted based on the time of day
- Tap a session card to **mark it complete** — progress is saved instantly

### Progress Tracking
- **Circular progress ring** showing percentage of this khatam complete
- **Stats grid**: pages read, pages left, days left, sessions completed
- **Bar chart** comparing your actual daily reading against the target (Canvas-based, fully offline)
- **Session history** with a dot indicator for each of the 5 prayers per day
- **Behind-schedule warning** if you fall behind, so you can catch up

### Technical
- **PWA** — install to your home screen on Android or iOS; works fully offline after first load
- **localStorage** — all data stays on your device, no backend, no account
- **Arabic-style design** — light green palette, Amiri serif for Arabic text, Islamic geometric background pattern, smooth CSS animations

---

## Screenshots

| Setup | Today's Schedule | Progress |
|-------|-----------------|----------|
| Set days or pick a finish date, choose starting Surah:Ayat | Prayer session cards with Surah/Ayat ranges, progress ring | Bar chart + session history |

---

## How to Use

1. Open the app at the link above (or install it to your home screen via the install prompt)
2. On first launch, configure your goal:
   - Choose **"In N days"** or **"By a date"** for your target
   - Optionally select a **starting Surah and Ayat** if you've already read some
   - Set your start date and tap **بسم الله — Start My Journey**
3. Each day, open the **Today** tab to see your 5 prayer sessions
4. Tap each session card after you've read to mark it done
5. Check the **Progress** tab for charts and history

---

## Local Development

No build step required — it's a plain HTML/CSS/JS app.

```bash
git clone https://github.com/ahmadfarisfs/quran-tracker.git
cd quran-tracker
# Serve with any static server, e.g.:
npx serve .
# Then open http://localhost:3000
```

Service workers require HTTPS or `localhost` — the local server covers this.

---

## Deployment

The app auto-deploys to **GitHub Pages** via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to the `claude/quran-tracker-pwa-X6Cfm` branch. The workflow publishes the root directory to the `gh-pages` branch using [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages).

To enable GitHub Pages in your own fork:  
**Settings → Pages → Source: Deploy from a branch → Branch: `gh-pages`**

---

## Tech Stack

| Layer | Detail |
|-------|--------|
| UI | Vanilla HTML + CSS (no framework) |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | [Amiri](https://fonts.google.com/specimen/Amiri) (Arabic), [Poppins](https://fonts.google.com/specimen/Poppins) (Latin) via Google Fonts |
| Chart | Canvas 2D API (no external chart library) |
| Offline | Service Worker + Cache API |
| Install | Web App Manifest (PWA) |
| Storage | `localStorage` |
| Deploy | GitHub Actions → GitHub Pages |

---

## Data

Page lookups use the exact 604-page **Medina Mushaf** boundaries from [Tanzil Quran metadata v1.0](https://tanzil.net/docs/quran_metadata), bundled in `src/lib/quranPages.js` for offline use. No interpolation or network request is used for page calculations. Bookmarks retain the exact Surah and Ayah because each page contains multiple ayat.

Source: [quran-data.xml](https://tanzil.net/res/text/metadata/quran-data.xml), copyright (C) 2008–2009 Tanzil.info, licensed `cc-by` as declared in the source. The bundled table extracts only the `sura` and `aya` attributes of all 604 `page` entries, ordered by `index`. Downloaded source SHA-256: `8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a`.

Existing saved pages are recalculated on load wherever an exact Surah/Ayah can be recovered. Records containing only a page number are preserved because their original ayah is unknown. Page numbers follow this specific Mushaf layout; other printed editions may paginate differently.

---

*May Allah accept your recitation and make it a light for you. آمين*
