🏓 Simple Pong – 10 Levels of Progressive Challenge

A minimalist yet deep Pong implementation built with HTML5 Canvas and vanilla JavaScript.
Face off against an adaptive AI across 10 distinct levels, each with unique ball speed, CPU reaction, paddle size, and point requirements.
Track your personal best, control your paddle with a mouse or keyboard, and climb from Beginner to Legend.
<img width="1888" height="1079" alt="Screenshot 2026-02-12 215408" src="https://github.com/user-attachments/assets/8c7f895b-9555-476d-9100-e62c5d87e711" />


✨ Features

- 10 progressive levels – from Beginner to Legend.
- Level‑specific modifiers – ball speed, CPU speed, paddle height, and required points to advance.
- Score‑based progression – score the required number of points in a level to move up.
- Smart CPU opponent – reacts faster on higher levels; returns to the centre when idle.
- Dual paddle control – use mouse (real‑time) or arrow keys (discrete).
- Touch support – play on tablets and touchscreens.
- Pause / Resume – press Space.
- Instant restart – press R at any time.
- Persistent highscore – your best total score is saved in your browser (LocalStorage).
- Visual feedback – level transition animation, progress bar, game‑over screen.
- Clean dark‑theme UI – smooth gradients and subtle neon accents.

🎮 How to Play

- You control the left paddle (blue).
- The computer controls the right paddle (orange).
- Score a point by hitting the ball past the computer’s paddle.
- Win the current level by reaching the target points displayed on the progress bar.
- Advance through all 10 levels and try to set a new high score (your total player points in one run).

📊 Levels & Difficulty

| Level |  Name        |  Ball Speed |  CPU Speed  | Paddle Height  | Points to Advance |
|-------|:------------:|:-----------:|:-----------:|:--------------:|------------------:|
|  1	  | Beginner	   |     5.0	   |    5.0	     |      110	      |        3          |
|  2    |	Novice	     |     5.5	   |    5.5	     |      100	      |        3          |
|  3	  | Rookie	     |     6.0     |    6.0	     |      90        |        3          |
|  4	  | Amateur	     |     6.5	   |    6.5	     |      80        |        4          |
|  5	  | Intermediate |     7.0	   |    7.0	     |      75	      |        4          |
|  6	  | Skilled	     |     7.5     |    7.5	     |      70	      |        4          |
|  7	  | Advanced	   |     8.0	   |    8.0	     |      65	      |        5          |
|  8	  | Expert	     |     8.5	   |    8.5	     |      60	      |        5          |
|  9	  | Master	     |     9.0     |    9.0	     |      55	      |        5          |
|  10	  | Legend	     |     10.0	   |    10.0	   |      50	      |        6          |

The high score is the total number of player points accumulated during a single playthrough.

🕹️ Controls

|     Action	       |           Input                |
|--------------------|-------------------------------:|
| Move paddle up	   |  ↑ (Arrow Up) or mouse move    |
| Move paddle down	 |  ↓ (Arrow Down) or mouse move  |
| Pause / Resume	   |  Space                         |
| Restart game	     |  R                             |
| Touch	             |  Drag vertically on canvas     |
- Mouse: the paddle follows your cursor smoothly – no click needed.
- Keyboard: discrete steps, can be combined with the mouse.

🛠️ Technologies Used

- HTML5 – structure & canvas element.
- CSS3 – modern layout, gradients, dark theme.
- JavaScript – game loop, collision detection, AI, rendering.
- LocalStorage API – persist high score across sessions.

No frameworks, no dependencies – just open index.html and play.

🚀 Getting Started

1. Clone the repository:
[git clone https://github.com/your-username/simple-pong-levels.git](https://github.com/UmarMuhammad18/Ping-Pong-Game.git)

2. Open pingpong.html in any modern browser (Chrome, Firefox, Edge, Safari).

3. Start playing – your high score is automatically saved.

📁 Project Structure

simple-pong-levels/

├── pingpong.html      # Main game page

├── pingpong.css       # All styling

├── pingpong.js        # Game logic, levels, rendering

└── README.md

💡 Possible Improvements

- 🔊 Add sound effects (hit, score, level up).
- 🏆 Fix highscore saving (currently loads but does not update – simple fix).
- 🌐 Online leaderboard.
- 📱 Better responsive scaling for very small screens.
- ⚔️ Two‑player local mode.

📄 License

This project is open source and available under the MIT License.
