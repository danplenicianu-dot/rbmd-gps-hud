# RBMD GPS HUD

A 600x600 web app prototype for Meta Ray-Ban Display glasses. It follows the Meta Wearables Web App toolkit constraints: dark transparent-friendly UI, high contrast, D-pad navigation through arrow keys, and `.focusable` controls.

## Features

- Live browser GPS when served over HTTPS
- Demo route fallback when location is unavailable
- Bearing arrow, distance, speed, ETA, and route cues
- Destination presets and current-position pin
- Metric/imperial display setting
- No API keys or build step required

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

Use arrow keys to move focus and `Enter` to activate controls. In Chrome DevTools, use More tools -> Sensors to simulate GPS.

## Publish

This project is ready for GitHub Pages. After pushing it to a GitHub repository, enable Pages from the repository settings and select the main branch root folder.

For the glasses, the final URL must be public HTTPS. Add it in the Meta AI app under Devices -> Display Glasses settings -> App connections -> Web apps.
