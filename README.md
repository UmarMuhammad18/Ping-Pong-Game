# Simple Pong — 10 Levels of Progressive Challenge

A Pong game built with HTML5 Canvas and vanilla JavaScript.

Face an adaptive CPU across 10 courts, from Beginner to Legend. You get five lives. Power-ups spawn mid-rally. High score is saved in the browser.

The original navy court, dashed net, and ice / clay paddles are still the look. Controls, lives, sound, and mobile play are new.

**Play live:** [ping-pong-game-blush.vercel.app](https://ping-pong-game-blush.vercel.app)

![Simple Pong](https://github.com/user-attachments/assets/8c7f895b-9555-476d-9100-e62c5d87e711)

## Features

- **10 progressive levels** — Beginner through Legend, each with its own ball speed, CPU speed, paddle height, and points to advance
- **Five lives** — a point against you costs a life; run ends at zero
- **Power-ups** — Wide, Slow, Multi, Magnet, Burst (spawn mid-rally)
- **Adaptive CPU** — predicts the bounce, then adds error that tightens each court
- **Working high score** — best score and highest court saved in LocalStorage
- **Sound** — hit, wall, score, level-up, and a light music loop (mute in Settings)
- **Mobile** — drag the court or hold the on-screen paddle buttons
- **Desktop** — mouse follow, W/S or arrows, Space to pause, R to restart, gamepad
- **Responsive court** — letterboxed canvas that fills phone and desktop viewports

## How to play

You control the **left paddle** (ice blue). The computer controls the **right paddle** (clay).

1. Send the ball past the CPU to score.
2. Reach the level's point target (progress bar) to advance.
3. Lose a life when the ball gets past you.
4. Clear all 10 courts — or set a new high score before you run out of lives.

High score is the total player points from a single run.

## Power-ups

Orbs appear on the court during a rally. Hit one to activate it for a few seconds.

| Orb | Effect |
| --- | --- |
| **W** Wide | Your paddle grows |
| **S** Slow | The ball eases off |
| **M** Multi | A second ball splits off |
| **G** Magnet | Incoming balls pull toward your paddle |
| **B** Burst | The next hit launches harder |

## Levels

| Level | Name | Ball speed | CPU speed | Paddle height | Points to advance |
| --- | --- | --- | --- | --- | --- |
| 1 | Beginner | 320 | 280 | 118 | 3 |
| 2 | Novice | 350 | 310 | 108 | 3 |
| 3 | Rookie | 380 | 340 | 98 | 3 |
| 4 | Amateur | 410 | 370 | 90 | 4 |
| 5 | Intermediate | 440 | 400 | 82 | 4 |
| 6 | Skilled | 470 | 430 | 76 | 4 |
| 7 | Advanced | 500 | 460 | 70 | 5 |
| 8 | Expert | 535 | 500 | 64 | 5 |
| 9 | Master | 570 | 540 | 58 | 5 |
| 10 | Legend | 620 | 590 | 52 | 6 |

## Controls

| Action | Input |
| --- | --- |
| Move paddle | Mouse over the court, W / S, ↑ / ↓, drag, or hold ▲ / ▼ |
| Pause / resume | Space, Esc, P, or the Pause button |
| Restart | R |
| Volume & shake | Settings |

On a phone, drag vertically on the court or hold the paddle buttons under the canvas.

## Run locally

```bash
git clone https://github.com/UmarMuhammad18/Ping-Pong-Game.git
cd Ping-Pong-Game
```

Open `pingpong.html` in Chrome, Firefox, Edge, or Safari. No build step, no dependencies.

## Project structure

```
Ping-Pong-Game/
├── pingpong.html   # Page, HUD, overlays, paddle buttons
├── pingpong.css    # Navy court theme
├── pingpong.js     # Loop, physics, AI, audio, input
├── vercel.json     # Static rewrite to pingpong.html
└── README.md
```

## Tech

HTML5 Canvas, CSS, vanilla JavaScript, Web Audio API, LocalStorage.

## License

MIT
