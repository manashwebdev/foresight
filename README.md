# Foresight

**A calibration lab for your predictions.** People are confident far more often than they are correct. Foresight shows you the gap.

Log a prediction ("I'll ship this by Friday") with how sure you are (50–99%). Resolve it later. Foresight scores you with the **Brier score**, plots a **calibration curve** (your confidence vs. how often you were actually right) and tells you whether you are overconfident, underconfident or well calibrated, per category.

## Stack
- **Backend:** Node.js (zero dependencies), REST API, JSON file persistence
- **Frontend:** Vanilla JS, SVG charts, CSS glow and motion

## Run
```bash
npm start        # http://localhost:4000
```
Click "Load demo data" to see a populated chart.

## API
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/predictions` | List predictions |
| POST | `/api/predictions` | Create `{text, confidence, category}` |
| POST | `/api/predictions/:id/resolve` | Resolve `{outcome: true/false}` |
| DELETE | `/api/predictions/:id` | Delete |
| GET | `/api/stats` | Brier score, accuracy, calibration buckets, category gaps |

## Deploy
Push to GitHub, create a Render web service, build command empty, start command `npm start`. Backend and frontend ship together.

## Structure
```
server/  server.js (routes) · stats.js (scoring) · store.js (persistence)
public/  index.html · styles.css · app.js
```
