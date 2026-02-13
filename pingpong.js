// Simple Pong - HTML5 Canvas
// Left paddle: player (mouse + arrow keys). Right paddle: CPU.
// Includes bouncing ball, paddle/wall collisions, scoreboard, pause (Space).

console.log('Pong game loading...');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

console.log('Canvas element:', canvas);
console.log('Canvas context:', ctx);
console.log('Score element:', scoreEl);

if (!canvas) {
  console.error('Canvas element not found!');
}
if (!ctx) {
  console.error('Canvas context not available!');
}

const W = canvas.width;
const H = canvas.height;

// Game objects
const paddleWidth = 12;
let paddleHeight = 110; // Will be updated based on level
const paddleSpeed = 6;

const leftPaddle = {
  x: 10,
  y: H / 2 - 55,
  w: paddleWidth,
  h: paddleHeight,
};

const rightPaddle = {
  x: W - paddleWidth - 10,
  y: H / 2 - 55,
  w: paddleWidth,
  h: paddleHeight,
  speed: 5
};

const ball = {
  x: W / 2,
  y: H / 2,
  r: 8,
  speed: 5,
  dx: 0,
  dy: 0,
};

// Game state
let scores = { left: 0, right: 0 };
let paused = false;
let level = 1;
let maxLevels = 10;
let pointsToNextLevel = 3; // Points needed to advance to next level
let pointsInCurrentLevel = 0;
let highscore = parseInt(localStorage.getItem('pongHighscore')) || 0;
let gameOverFlag = false;
let levelTransition = false;
let levelTransitionTime = 0;

// Level progression - Enhanced with names
const levelSettings = [
  { name: "Beginner", ballSpeed: 5, cpuSpeed: 5, paddleHeight: 110, pointsToAdvance: 3 },
  { name: "Novice", ballSpeed: 5.5, cpuSpeed: 5.5, paddleHeight: 100, pointsToAdvance: 3 },
  { name: "Rookie", ballSpeed: 6, cpuSpeed: 6, paddleHeight: 90, pointsToAdvance: 3 },
  { name: "Amateur", ballSpeed: 6.5, cpuSpeed: 6.5, paddleHeight: 80, pointsToAdvance: 4 },
  { name: "Intermediate", ballSpeed: 7, cpuSpeed: 7, paddleHeight: 75, pointsToAdvance: 4 },
  { name: "Skilled", ballSpeed: 7.5, cpuSpeed: 7.5, paddleHeight: 70, pointsToAdvance: 4 },
  { name: "Advanced", ballSpeed: 8, cpuSpeed: 8, paddleHeight: 65, pointsToAdvance: 5 },
  { name: "Expert", ballSpeed: 8.5, cpuSpeed: 8.5, paddleHeight: 60, pointsToAdvance: 5 },
  { name: "Master", ballSpeed: 9, cpuSpeed: 9, paddleHeight: 55, pointsToAdvance: 5 },
  { name: "Legend", ballSpeed: 10, cpuSpeed: 10, paddleHeight: 50, pointsToAdvance: 6 }
];

// Input state
let keys = { ArrowUp: false, ArrowDown: false };
let mouseY = null;
let lastMouseMoveTime = 0;

// Utility
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function rand(min,max){ return Math.random()*(max-min)+min; }

// Reset ball to center and send toward the player who conceded the point
function resetBall(towardRight = (Math.random() > 0.5)){
  ball.x = W/2;
  ball.y = H/2;
  ball.speed = levelSettings[level - 1].ballSpeed;
  // random angle between -40 and 40 degrees
  const angle = (rand(-0.7, 0.7)); // radians ~ +/-40 deg
  ball.dx = towardRight ? Math.cos(angle) * ball.speed : -Math.cos(angle) * ball.speed;
  ball.dy = Math.sin(angle) * ball.speed;
}

// Apply level settings
function applyLevelSettings() {
  const settings = levelSettings[level - 1];
  ball.speed = settings.ballSpeed;
  rightPaddle.speed = settings.cpuSpeed;
  paddleHeight = settings.paddleHeight;
  leftPaddle.h = paddleHeight;
  rightPaddle.h = paddleHeight;
  pointsToNextLevel = settings.pointsToAdvance;
  
  // Center paddles with new height
  leftPaddle.y = clamp(leftPaddle.y, 0, H - leftPaddle.h);
  rightPaddle.y = clamp(rightPaddle.y, 0, H - rightPaddle.h);
  
  // Reset points in current level when level changes
  pointsInCurrentLevel = 0;
  
  updateScoreHUD();
  
  // Level transition effect
  levelTransition = true;
  levelTransitionTime = Date.now();
}

// Level up function
function levelUp(){
  if(level < levelSettings.length){
    level++;
    applyLevelSettings();
  }
}

// Game over function
function gameOver(){
  paused = true;
  gameOverFlag = true;
  if(scores.left > highscore){
    highscore = scores.left;
    localStorage.setItem('pongHighscore', highscore);
  }
}

// Reset game function
function resetGame(){
  scores.left = 0;
  scores.right = 0;
  level = 1;
  pointsInCurrentLevel = 0;
  gameOverFlag = false;
  levelTransition = false;
  applyLevelSettings();
  leftPaddle.y = (H - leftPaddle.h) / 2;
  rightPaddle.y = (H - rightPaddle.h) / 2;
  resetBall(Math.random() > 0.5);
  updateScoreHUD();
  paused = false;
}

// Draw helpers
function drawRect(x,y,w,h,color='white'){ ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
function drawCircle(x,y,r,color='white'){ ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
function drawNet(){
  const seg = 12;
  ctx.fillStyle = '#123244';
  for(let i=0;i<H;i+=seg*2){
    ctx.fillRect(W/2 - 2, i, 4, seg);
  }
}

// Draw level progress bar
function drawProgressBar() {
  const barWidth = 200;
  const barHeight = 8;
  const x = W/2 - barWidth/2;
  const y = 70;
  
  // Background
  ctx.fillStyle = '#123244';
  ctx.fillRect(x, y, barWidth, barHeight);
  
  // Progress
  const progress = Math.min(pointsInCurrentLevel / pointsToNextLevel, 1);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x, y, barWidth * progress, barHeight);
  
  // Border
  ctx.strokeStyle = '#2a4a66';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barWidth, barHeight);
  
  // Text
  ctx.fillStyle = '#9fb7c9';
  ctx.font = '12px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Level Progress: ${pointsInCurrentLevel}/${pointsToNextLevel} points`, W/2, y + 20);
}

function draw(){
  // Clear
  ctx.clearRect(0,0,W,H);
  
  if(gameOverFlag){
    // Game over screen
    const winner = scores.left >= pointsToNextLevel ? 'Player' : 'Computer';
    ctx.fillStyle = 'rgba(11, 18, 32, 0.95)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6eef7';
    ctx.font = '48px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${winner} Wins!`, W/2, H/2 - 80);
    ctx.font = '24px system-ui, Arial';
    ctx.fillText(`Final Score: ${scores.left} - ${scores.right}`, W/2, H/2 - 30);
    ctx.fillText(`Level Reached: ${levelSettings[level-1].name} (${level})`, W/2, H/2 + 10);
    ctx.fillText(`Highscore: ${highscore}`, W/2, H/2 + 50);
    ctx.font = '18px system-ui, Arial';
    ctx.fillText('Press R to restart or Space to resume', W/2, H/2 + 100);
    return;
  }
  
  // Level transition effect
  if(levelTransition && Date.now() - levelTransitionTime < 1000){
    const alpha = Math.min(1, (Date.now() - levelTransitionTime) / 500);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.3 * (1 - alpha)})`;
    ctx.fillRect(0, 0, W, H);
    
    if(Date.now() - levelTransitionTime < 800){
      ctx.fillStyle = '#e6eef7';
      ctx.font = '32px system-ui, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Level ${level}: ${levelSettings[level-1].name}`, W/2, H/2);
    }
  } else {
    levelTransition = false;
  }
  
  // Background gradient handled by CSS - just draw net and objects
  drawNet();

  // Paddles
  drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h, '#9fd8f6');
  drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h, '#f6b38b');

  // Ball
  drawCircle(ball.x, ball.y, ball.r, '#e7f6ff');

  // Level display with progress bar
  ctx.fillStyle = '#bfe9ff';
  ctx.font = 'bold 20px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level}: ${levelSettings[level-1].name}`, W/2, 30);
  
  // Scores
  ctx.font = 'bold 36px system-ui, Arial';
  ctx.fillStyle = '#9fd8f6';
  ctx.fillText(scores.left, W/2 - 100, 60);
  ctx.fillStyle = '#f6b38b';
  ctx.fillText(scores.right, W/2 + 100, 60);
  
  // Draw progress bar for next level
  drawProgressBar();
  
  // Pause indicator
  if(paused && !levelTransition && !gameOverFlag){
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(W/2 - 100, H/2 - 25, 200, 50);
    ctx.fillStyle = 'white';
    ctx.font = '24px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W/2, H/2 + 8);
  }
}

// Collision detection: ball with paddle
function checkPaddleCollision(paddle){
  // AABB-circle collision
  const nearestX = clamp(ball.x, paddle.x, paddle.x + paddle.w);
  const nearestY = clamp(ball.y, paddle.y, paddle.y + paddle.h);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return (dx*dx + dy*dy) <= (ball.r * ball.r);
}

function update(dt){
  if(paused || levelTransition) return;

  // Player input: keyboard
  if(keys.ArrowUp) leftPaddle.y -= paddleSpeed;
  if(keys.ArrowDown) leftPaddle.y += paddleSpeed;

  // Mouse input: if recent move, use mouse to center paddle
  if(Date.now() - lastMouseMoveTime < 200 && mouseY !== null){
    const targetY = mouseY - leftPaddle.h/2;
    // Smoothly interpolate so arrow keys can still be effective
    leftPaddle.y += (targetY - leftPaddle.y) * 0.35;
  }

  // Clamp paddles
  leftPaddle.y = clamp(leftPaddle.y, 0, H - leftPaddle.h);

  // Simple CPU AI: follow ball with max speed, only react if ball moving toward it OR within center area
  const cpuCenter = rightPaddle.y + rightPaddle.h / 2;
  const ballApproaching = ball.dx > 0;
  const targetY = ball.y - rightPaddle.h / 2;
  if(ballApproaching || Math.abs(ball.x - W/2) < 60){
    if (Math.abs(cpuCenter - (ball.y)) > 4) {
      if(cpuCenter < ball.y) rightPaddle.y += rightPaddle.speed;
      else if(cpuCenter > ball.y) rightPaddle.y -= rightPaddle.speed;
    }
  } else {
    // slowly return to center
    const centerTarget = H/2 - rightPaddle.h/2;
    rightPaddle.y += (centerTarget - rightPaddle.y) * 0.03;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, H - rightPaddle.h);

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall collisions (top/bottom)
  if(ball.y - ball.r <= 0){
    ball.y = ball.r;
    ball.dy *= -1;
  } else if(ball.y + ball.r >= H){
    ball.y = H - ball.r;
    ball.dy *= -1;
  }

  // Paddle collisions
  // Left paddle
  if(ball.dx < 0 && checkPaddleCollision(leftPaddle)){
    ball.x = leftPaddle.x + leftPaddle.w + ball.r + 0.1;
    // Calculate hit position relative to paddle center
    const rel = (ball.y - (leftPaddle.y + leftPaddle.h/2)) / (leftPaddle.h/2);
    const bounceAngle = rel * (Math.PI/3); // up to 60 degrees
    const speedInc = 1.02; // Reduced from 1.08 for better control
    ball.speed = Math.min(ball.speed * speedInc, levelSettings[level-1].ballSpeed * 1.5);
    ball.dx = Math.cos(bounceAngle) * ball.speed;
    ball.dy = Math.sin(bounceAngle) * ball.speed;
    if(ball.dx < 0) ball.dx = -ball.dx; // ensure it's to the right
  }

  // Right paddle
  if(ball.dx > 0 && checkPaddleCollision(rightPaddle)){
    ball.x = rightPaddle.x - ball.r - 0.1;
    const rel = (ball.y - (rightPaddle.y + rightPaddle.h/2)) / (rightPaddle.h/2);
    const bounceAngle = rel * (Math.PI/3);
    const speedInc = 1.02;
    ball.speed = Math.min(ball.speed * speedInc, levelSettings[level-1].ballSpeed * 1.5);
    ball.dx = -Math.cos(bounceAngle) * ball.speed;
    ball.dy = Math.sin(bounceAngle) * ball.speed;
    if(ball.dx > 0) ball.dx = -ball.dx; // ensure it's to the left
  }

  // Score: ball off left or right edges
  if(ball.x + ball.r < 0){
    // CPU scores
    scores.right += 1;
    updateScoreHUD();
    resetBall(true); // send toward right (player will serve left)
  } else if(ball.x - ball.r > W){
    // Player scores
    scores.left += 1;
    pointsInCurrentLevel += 1;
    updateScoreHUD();
    
    // Check for level completion
    if(pointsInCurrentLevel >= pointsToNextLevel){
      if(level < levelSettings.length){
        levelUp();
      } else {
        // Beat the game!
        gameOverFlag = true;
        paused = true;
      }
    } else {
      resetBall(false);
    }
  }
}

function updateScoreHUD(){
  scoreEl.textContent = `Player ${scores.left} — ${scores.right} Computer | Level ${level}: ${levelSettings[level-1].name} | Highscore ${highscore}`;
}

let lastTime = performance.now();
function loop(t){
  const dt = t - lastTime;
  lastTime = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
window.addEventListener('keydown', (e) => {
  if(e.code === 'Space'){ 
    if(gameOverFlag){
      // Resume from game over
      gameOverFlag = false;
      paused = false;
    } else {
      paused = !paused; 
    }
  }
  if(e.code === 'KeyR'){ resetGame(); }
  if(e.code === 'ArrowUp' || e.code === 'ArrowDown'){
    keys[e.code] = true;
  }
});
window.addEventListener('keyup', (e) => {
  if(e.code === 'ArrowUp' || e.code === 'ArrowDown'){
    keys[e.code] = false;
  }
});

// Mouse movement: get mouse y relative to canvas
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  lastMouseMoveTime = Date.now();
});

// Touch support (optional)
canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouseY = (t.clientY - rect.top) * (canvas.height / rect.height);
  lastMouseMoveTime = Date.now();
  e.preventDefault();
}, { passive: false });

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing game...');
  applyLevelSettings(); // Apply initial level settings
  resetBall(Math.random() > 0.5);
  updateScoreHUD();
  requestAnimationFrame(loop);
});

// Focus hint: click canvas to ensure keyboard works
canvas.addEventListener('click', () => canvas.focus && canvas.focus());