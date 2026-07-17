# Poultry Detection Dashboard

## Install

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`.

## Threshold Information

The current alert threshold is `3`.

- The threshold is defined in `src/data/mockData.js` as `ALERT_THRESHOLD`.
- The chart uses this value for the dashed threshold line.
- The detection history and summary cards use the same value for alert logic.
- Any hourly respiratory distress value at or above `3` is treated as flagged.
