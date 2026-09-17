# Simple Pong

A Pong game built with HTML5 Canvas and vanilla JavaScript.

Face an adaptive CPU across 10 courts, from Beginner to Legend. Five lives. Power-ups spawn mid-rally. High score is saved in the browser.

The original navy court, dashed net, and ice / clay paddles are unchanged. Hits, lives, sound, and on-screen paddle buttons are new.

![Simple Pong](https://github.com/user-attachments/assets/8c7f895b-9555-476d-9100-e62c5d87e711)

## Features

- 10 progressive levels with unique ball speed, CPU reaction, paddle size, and points to advance
- Five lives per run
- Power-ups: Wide, Slow, Multi, Magnet, Burst
- Adaptive CPU with prediction and error that tightens each court
- Mouse / trackpad follow, keyboard (W/S or arrows), touch drag, on-screen hold buttons, gamepad
- Pause with Space / Esc / P, restart with R
- Hit sounds, score cues, and a light music loop (volume in Settings)
- High score and best court saved in LocalStorage
- Responsive canvas that fills the viewport on phone and desktop

## How to play

You are the left paddle (ice blue). The CPU is the right paddle (clay).

Score by sending the ball past the CPU. Reach the level's point target to advance. Lose a life when the ball gets past you. Survive all ten courts.

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

High score is the total player points from a single run.

## Controls

| Action | Input |
| --- | --- |
| Move paddle | Mouse over the court, W/S, arrow keys, drag, or hold ▲ / ▼ |
| Pause / resume | Space, Esc, P, or the Pause button |
| Restart | R |
| Settings | Gear button — master / SFX / music / shake |

## Run locally

```bash
git clone https://github.com/UmarMuhammad18/Ping-Pong-Game.git
cd Ping-Pong-Game
```

Open `pingpong.html` in a modern browser. No build step, no dependencies.

## Project structure

```
Ping-Pong-Game/
├── pingpong.html   # Page, HUD, overlays, paddle buttons
├── pingpong.css    # Navy court theme
├── pingpong.js     # Loop, physics, AI, audio, input
├── vercel.json     # Static rewrite to pingpong.html
└── README.md
```

## License

MIT
