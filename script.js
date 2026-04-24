const game = document.getElementById("game");
const cart = document.getElementById("cart");
const cartImg = document.getElementById("cartImg");
const BASE_WIDTH = 1920;
const scale = game.clientWidth / BASE_WIDTH;

let score = 0;
let lives = 3;
let time = 0;
let running = true;

/* SOUND */
const catchSound = new Audio(
  "https://www.soundjay.com/buttons/sounds/button-3.mp3",
);
const boomSound = new Audio(
  "https://www.soundjay.com/explosion/sounds/explosion-01.mp3",
);

/* LANES */
let lanes = [];

/* SAFE INIT */
function calculateLanes() {
  const gameWidth = game.clientWidth;

  const laneWidth = game.clientWidth * 0.06;
  const gap = game.clientWidth * 0.02;

  const totalWidth = laneWidth * 8 + gap * 5;
  const startX = (gameWidth - totalWidth) / 2;

  lanes = [];

  for (let i = 0; i < 8; i++) {
    lanes.push(startX + i * (laneWidth + gap));
  }
}

/* CART */
let currentLaneIndex = 4;

function setCartToLane(index) {
  if (index < 0) index = 0;
  if (index >= lanes.length) index = lanes.length - 1;

  currentLaneIndex = index;
  cart.style.left = lanes[currentLaneIndex] + "px";
}

/* MOVE BY POSITION */
function moveCart(x) {
  const rect = game.getBoundingClientRect();
  const relativeX = x - rect.left;

  let closestIndex = 0;
  let minDist = Infinity;

  lanes.forEach((lane, i) => {
    let d = Math.abs(lane - relativeX);
    if (d < minDist) {
      minDist = d;
      closestIndex = i;
    }
  });

  setCartToLane(closestIndex);
}

/* INPUTS */
game.addEventListener("click", (e) => moveCart(e.clientX));
game.addEventListener("touchstart", (e) => moveCart(e.touches[0].clientX));

let dragging = false;
game.addEventListener("mousedown", () => (dragging = true));
game.addEventListener("mouseup", () => (dragging = false));
game.addEventListener("mouseleave", () => (dragging = false));

game.addEventListener("mousemove", (e) => {
  if (dragging) moveCart(e.clientX);
});

game.addEventListener("touchmove", (e) => {
  moveCart(e.touches[0].clientX);
});

/* KEYBOARD (SAFE) */
document.addEventListener("keydown", (e) => {
  if (!running) return;

  if (e.key === "ArrowLeft") {
    setCartToLane(currentLaneIndex - 1);
  }

  if (e.key === "ArrowRight") {
    setCartToLane(currentLaneIndex + 1);
  }
});

/* ITEMS */
const items = ["🧸", "🍎", "🎁", "📦", "📱", "🎧", "💻"];
const bomb = "💣";

let dropSpeed = 4 * scale;
let spawnDelay = 2000 / scale;

let activeItems = [];

/* SPAWN */
function spawnOne() {
  if (!running || lanes.length === 0) return;

  const lane = lanes[Math.floor(Math.random() * lanes.length)];

  const el = document.createElement("div");
  el.className = "item";

  let isBomb = Math.random() < 0.15;
  el.textContent = isBomb
    ? bomb
    : items[Math.floor(Math.random() * items.length)];

  el.style.left = lane + "px";
  game.appendChild(el);

  activeItems.push({
    el,
    y: -50,
    isBomb,
  });

  setTimeout(spawnOne, spawnDelay);
  spawnDelay *= 0.985;
  dropSpeed += 0.04;
}

/* LOOP */
function update() {
  if (!running) return;

  const cartRect = cartImg.getBoundingClientRect();
  const cartCenterX = cartRect.left + cartRect.width / 2;

  for (let i = activeItems.length - 1; i >= 0; i--) {
    let obj = activeItems[i];

    obj.y += dropSpeed;
    obj.el.style.top = obj.y + "px";

    const r1 = obj.el.getBoundingClientRect();

    const itemCenterX = r1.left + r1.width / 2;
    const inCenterZone =
      Math.abs(itemCenterX - cartCenterX) < cartRect.width * 0.24;

    const verticalTouch = r1.bottom >= cartRect.top + cartRect.height * 0.3;

    /* CATCH */
    if (verticalTouch && inCenterZone) {
      if (obj.isBomb) {
        boomSound.play();
        gameOver();
      } else {
        catchSound.play();
        score += 10;
        document.getElementById("score").textContent = score;
      }

      obj.el.remove();
      activeItems.splice(i, 1);
      continue;
    }

    /* MISS */
    if (obj.y > game.clientHeight) {
      if (!obj.isBomb) {
        lives--;
        updateLives();
        if (lives <= 0) gameOver();
      }

      obj.el.remove();
      activeItems.splice(i, 1);
    }
  }

  requestAnimationFrame(update);
}

/* TIMER */
setInterval(() => {
  if (!running) return;

  time++;
  let m = Math.floor(time / 60);
  let s = time % 60;

  document.getElementById("time").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}, 1000);

/* LIVES */
function updateLives() {
  document.getElementById("lives").textContent = "❤️".repeat(lives);
}

/* GAME OVER */
function gameOver() {
  running = false;
  saveScore(score);
  updateLeaderboard();
  document.getElementById("gameOver").style.display = "block";
}

/* RESTART */
function restart() {
  location.reload();
}

/* LEADERBOARD */
function saveScore(s) {
  let arr = JSON.parse(localStorage.getItem("scores")) || [];
  arr.push(s);
  arr.sort((a, b) => b - a);
  arr = arr.slice(0, 10);
  localStorage.setItem("scores", JSON.stringify(arr));
}

function updateLeaderboard() {
  let arr = JSON.parse(localStorage.getItem("scores")) || [];
  const ranks = document.getElementById("ranks");
  ranks.innerHTML = "";

  arr.forEach((s, i) => {
    let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

    let div = document.createElement("div");
    div.className = "rank";
    div.innerHTML = `<span>${medal}</span><span>${s}</span>`;
    ranks.appendChild(div);
  });
}

/* INIT (SAFE ORDER) */
window.onload = () => {
  calculateLanes();
  setCartToLane(4);
  updateLeaderboard();
  spawnOne();
  requestAnimationFrame(update);
};
