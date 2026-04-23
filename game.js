window.addEventListener("DOMContentLoaded", () => {
  const game = document.getElementById("gameContainer");
  const cart = document.getElementById("cart");

  const hudScore = document.getElementById("hudScore");
  const hudTime = document.getElementById("hudTime");
  const hudLives = document.getElementById("hudLives");

  const gameOverScreen = document.getElementById("gameOver");
  const finalScore = document.getElementById("finalScore");
  const scoreList = document.getElementById("scoreList");
  const banner = document.getElementById("newHighScoreBanner");

  /* ================= AUDIO ================= */
  const sounds = {
    catch: new Audio("assets/catch.mp3"),
    miss: new Audio("assets/miss.mp3"),
    bonus: new Audio("assets/bonus.mp3"),
  };

  Object.values(sounds).forEach((s) => {
    s.preload = "auto";
    s.load();
  });

  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;

    Object.values(sounds).forEach((s) => {
      try {
        s.volume = 1.0;
        const p = s.play();
        if (p) {
          p.then(() => {
            s.pause();
            s.currentTime = 0;
          }).catch(() => {});
        }
      } catch {}
    });

    audioUnlocked = true;
  }

  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  function play(s) {
    if (!audioUnlocked) return;
    const base = sounds[s];
    if (!base) return;

    const clone = base.cloneNode();
    clone.volume = 1.0;
    clone.play().catch(() => {});
  }

  /* ================= GAME DATA ================= */
  const itemsPool = [
    "🧸",
    "📱",
    "🎧",
    "💻",
    "🏀",
    "⚽",
    "🍞",
    "🥛",
    "📦",
    "🌸",
  ];

  let cartX = 200;
  let targetX = 200;

  let score = 0;
  let lives = 3;
  let startTime = 0;

  let running = false;
  let items = [];
  let spawnDelay = 1200;

  /* ================= COMBO ================= */
  let combo = 0;
  let multiplier = 1;

  /* ================= INPUT ================= */
  let keys = {};

  document.addEventListener("mousemove", (e) => {
    const rect = game.getBoundingClientRect();
    targetX = e.clientX - rect.left - 80;
  });

  document.addEventListener("keydown", (e) => (keys[e.key] = true));
  document.addEventListener("keyup", (e) => (keys[e.key] = false));

  document.addEventListener("touchmove", (e) => {
    const rect = game.getBoundingClientRect();
    if (e.touches.length > 0) {
      targetX = e.touches[0].clientX - rect.left - 80;
    }
  });

  /* ================= PARTICLES ================= */
  function particles(x, y, color) {
    if (!game) return;
    if (!isFinite(x) || !isFinite(y)) return;

    const safeZone = game.offsetHeight - 150;
    if (y > safeZone) return;

    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div");
      p.className = "particle";

      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = color;

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 50;

      p.style.setProperty("--x", Math.cos(angle) * dist + "px");
      p.style.setProperty("--y", Math.sin(angle) * dist + "px");

      game.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }

  /* ================= SPAWN ================= */
  function spawn() {
    if (!running) return;

    const el = document.createElement("div");
    el.className = "item";

    const isStar = Math.random() < 0.06;
    const item = isStar
      ? "⭐"
      : itemsPool[Math.floor(Math.random() * itemsPool.length)];

    // ✅ CENTER SPAWN RANGE (avoid HUD + leaderboard sides)
    const minX = game.offsetWidth * 0.25;
    const maxX = game.offsetWidth * 0.75;

    const x = Math.random() * (maxX - minX) + minX;

    // ✅ START BELOW TOP IMAGE
    const startY = 100;

    el.style.left = x + "px";
    el.style.top = startY + "px";
    el.textContent = item;

    game.appendChild(el);

    items.push({ el, x, y: startY, isStar });

    setTimeout(spawn, spawnDelay);
    spawnDelay = Math.max(300, spawnDelay - 10);
  }

  /* ================= GAME LOOP ================= */
  function update() {
    if (!running) return;

    if (keys["ArrowLeft"] || keys["a"]) targetX -= 10;
    if (keys["ArrowRight"] || keys["d"]) targetX += 10;

    cartX += (targetX - cartX) * 0.3;
    cartX = Math.max(0, Math.min(game.offsetWidth - 160, cartX));

    cart.style.left = cartX + "px";

    for (let i = items.length - 1; i >= 0; i--) {
      const o = items[i];
      o.y += 5.5;
      o.el.style.top = o.y + "px";

      /* ================= CATCH ================= */
      if (
        o.y > game.offsetHeight - 120 &&
        o.x > cartX - 40 &&
        o.x < cartX + 160
      ) {
        combo++;

        if (combo >= 20) multiplier = 5;
        else if (combo >= 10) multiplier = 3;
        else if (combo >= 5) multiplier = 2;
        else multiplier = 1;

        let gain = o.isStar ? 15 : 1;
        gain *= multiplier;

        score += gain;

        play(o.isStar ? "bonus" : "catch");
        particles(o.x, o.y, o.isStar ? "gold" : "white");

        o.el.remove();
        items.splice(i, 1);

        hudScore.textContent = score;
      }

      /* ================= MISS ================= */
      if (o.y > game.offsetHeight) {
        lives--;
        combo = 0;
        multiplier = 1;

        play("miss");
        particles(o.x, o.y, "red");

        o.el.remove();
        items.splice(i, 1);

        hudLives.textContent = "❤️".repeat(lives);

        if (lives <= 0) return endGame();
      }
    }

    hudTime.textContent = Math.floor((Date.now() - startTime) / 1000) + "s";

    requestAnimationFrame(update);
  }

  /* ================= START ================= */
  function startGame() {
    unlockAudio();

    items.forEach((i) => i.el?.remove());
    items = [];

    score = 0;
    lives = 3;
    combo = 0;
    multiplier = 1;

    spawnDelay = 1200;
    startTime = Date.now();

    running = true;
    gameOverScreen.style.display = "none";

    hudScore.textContent = 0;
    hudLives.textContent = "❤️❤️❤️";

    spawn();
    update();
  }

  /* ================= GAME OVER ================= */
  function endGame() {
    running = false;
    gameOverScreen.style.display = "block";

    finalScore.textContent = `Score: ${score}`;

    save(score);
    render();

    if (banner && score === getBestScore()) {
      banner.style.display = "block";
      setTimeout(() => (banner.style.display = "none"), 2500);
    }
  }

  /* ================= LEADERBOARD ================= */
  function save(s) {
    let arr = JSON.parse(localStorage.getItem("scores") || "[]");
    arr.push(s);
    arr.sort((a, b) => b - a);
    arr = arr.slice(0, 10);
    localStorage.setItem("scores", JSON.stringify(arr));
  }

  function getBestScore() {
    let arr = JSON.parse(localStorage.getItem("scores") || "[]");
    return arr[0] || 0;
  }

  /* ================= UI HELPERS ================= */
  function getAchievement(score) {
    if (score >= 300) return "🏆 LEGEND";
    if (score >= 200) return "🔥 MASTER";
    if (score >= 100) return "⭐ PRO";
    if (score >= 50) return "👍 GOOD";
    return "🎮 BEGINNER";
  }

  function getRankClass(i) {
    if (i === 0) return "rank1";
    if (i === 1) return "rank2";
    if (i === 2) return "rank3";
    return "rankN";
  }

  /* ================= RENDER LEADERBOARD ================= */
  function render() {
    if (!scoreList) return;

    let arr = JSON.parse(localStorage.getItem("scores") || "[]");

    scoreList.innerHTML = "";

    if (!arr.length) {
      scoreList.innerHTML = `<div class="emptyBoard">No scores yet</div>`;
      return;
    }

    arr.forEach((s, i) => {
      const card = document.createElement("div");

      card.className = "scoreCard";
      if (i === 0) card.classList.add("top1");

      card.innerHTML = `
      <div class="rankBadge ${getRankClass(i)}">${i + 1}</div>
 
      <div class="scoreInfo">
        <div class="scoreValue">${s} pts</div>
        <div class="scoreTag">${getAchievement(s)}</div>
      </div>
    `;

      scoreList.appendChild(card);
    });
  }

  /* ================= INIT ================= */
  window.restartGame = startGame;

  render();
  startGame();
});
