# RouteX

**Cross-chain execution intelligence, explained.**

RouteX continuously scores cross-chain bridge providers on cost, time, liquidity, and reliability — then tells you exactly why a route won. Built for the **Buildonomics** hackathon.

## Features

- **Command Center** — real-time overview of execution volume, network health, and performance trends, with a continuously rotating 3D network-topology animation in the hero banner.
- **Execution** — define a transfer and get an explainable, intelligent route recommendation across five bridge providers (CCTP, Stargate, Across, Hop, Wormhole), with cost/time/reliability breakdowns and runner-up alternatives.
- **Bridges** — compare provider utilization, market share, and a radar chart across speed, cost-efficiency, liquidity, and reliability.
- **Analytics** — execution volume, cost, latency, and success-rate trends over time.
- **Intelligence** — live model-confidence gauges per scoring signal, plus a rolling insight feed.
- **Security** — audit status, risk scores, and incident history per bridge provider.
- **Network** — an interactive, drag-to-rotate 3D topology of every supported chain, with live operational metrics.

## Design

A single "Signal" theme — moonlit silver surfaces with charcoal-grey anchor zones (sidebar, login, the 3D panels) and signal red as the one brand accent. No light/dark toggle.

## Tech stack

- Vanilla HTML, CSS, and JavaScript — no build step, no framework
- [Three.js](https://threejs.org/) for the 3D network visualizations
- Hand-written SVG charting (line/area, donut, sparkline, gauge, radar)
- Deterministic seeded mock data, so figures stay stable across reloads

## Running locally

No build step required. Either:

- Open `index.html` directly in a browser, or
- Serve the folder for best results (some browsers restrict local file access otherwise):
  ```
  python3 -m http.server 8000
  ```
  then visit `http://localhost:8000`.

## Project structure

```
RouteX/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── background.js
    ├── charts.js
    ├── data.js
    └── icons.js
```

## About

Built for **Buildonomics**. No real funds are moved — all data is simulated for demonstration purposes.
