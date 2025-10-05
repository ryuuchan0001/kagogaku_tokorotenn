const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const enemy = document.getElementById("enemy");
const result = document.getElementById("result");

let bgX = 0;
const playerX = 100;
let playerY = window.innerHeight / 2 - 50;
let enemyY = 100;
let enemySpeed = 2;
let bullets = [];
let isHit = false;
let gameStarted = false;
let recognition;
let audioContext;

//==============================
// 当たり判定ポリゴンデータ(JSON)
//==============================
const hitboxData = {
  "free": [
    { "nx": 0.3, "ny": 0.2822916507720947 },
    { "nx": 0.35, "ny": 0.35729165077209474 },
    { "nx": 0.64375, "ny": 0.3760416507720947 },
    { "nx": 0.64375, "ny": 0.3447916507720947 },
    { "nx": 0.725, "ny": 0.3322916507720947 },
    { "nx": 0.7375, "ny": 0.3760416507720947 },
    { "nx": 0.8375, "ny": 0.36979165077209475 },
    { "nx": 0.8375, "ny": 0.6322916507720947 },
    { "nx": 0.475, "ny": 0.6385416507720947 },
    { "nx": 0.1875, "ny": 0.6322916507720947 },
    { "nx": 0.18125, "ny": 0.33854165077209475 },
    { "nx": 0.225, "ny": 0.3322916507720947 }
  ],
  "bind": [
    { "nx": 0.665, "ny": 0.24305553436279298 },
    { "nx": 0.88, "ny": 0.20972220102945963 },
    { "nx": 0.8, "ny": 0.3763888676961263 },
    { "nx": 0.91, "ny": 0.5347222010294597 },
    { "nx": 0.89, "ny": 0.7597222010294596 },
    { "nx": 0.8, "ny": 0.818055534362793 },
    { "nx": 0.66, "ny": 0.718055534362793 },
    { "nx": 0.4, "ny": 0.8347222010294596 },
    { "nx": 0.32, "ny": 0.693055534362793 },
    { "nx": 0.16, "ny": 0.8263888676961263 },
    { "nx": 0.1, "ny": 0.6513888676961263 },
    { "nx": 0.09, "ny": 0.2013888676961263 },
    { "nx": 0.175, "ny": 0.2263888676961263 },
    { "nx": 0.355, "ny": 0.6597222010294597 },
    { "nx": 0.355, "ny": 0.19305553436279296 },
    { "nx": 0.4, "ny": 0.21805553436279296 },
    { "nx": 0.41, "ny": 0.368055534362793 },
    { "nx": 0.515, "ny": 0.368055534362793 },
    { "nx": 0.49, "ny": 0.2263888676961263 },
    { "nx": 0.57, "ny": 0.2013888676961263 }
  ]
};

//==============================
// 座標変換付きポリゴン生成
//==============================
function getPolygonFromJSON(element, type) {
  const json = hitboxData[type];
  const rect = element.getBoundingClientRect();
  return json.map(p => ({
    x: rect.left + p.nx * rect.width,
    y: rect.top + p.ny * rect.height
  }));
}

//==============================
// SAT法ポリゴン判定
//==============================
function polygonsCollide(polyA, polyB) {
  const polys = [polyA, polyB];
  for (let i = 0; i < polys.length; i++) {
    const polygon = polys[i];
    for (let j = 0; j < polygon.length; j++) {
      const k = (j + 1) % polygon.length;
      const edgeX = polygon[k].x - polygon[j].x;
      const edgeY = polygon[k].y - polygon[j].y;
      const normal = { x: -edgeY, y: edgeX };
      let [minA, maxA] = projectPolygon(polyA, normal);
      let [minB, maxB] = projectPolygon(polyB, normal);
      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
}

function projectPolygon(polygon, axis) {
  const dots = polygon.map(p => (p.x * axis.x + p.y * axis.y));
  return [Math.min(...dots), Math.max(...dots)];
}

//==============================
// 敵の動き・弾の処理
//==============================
function moveEnemy() {
  enemyY += enemySpeed;
  if (enemyY <= 0 || enemyY >= window.innerHeight - 100) enemySpeed *= -1;
  enemy.style.top = enemyY + "px";
}

function shootBullet() {
  const bullet = document.createElement("img");
  bullet.src = "image/bind.png";
  bullet.className = "bullet";
  gameArea.appendChild(bullet);
  const startWorldX = -bgX + enemy.offsetLeft;
  const startWorldY = enemyY + enemy.offsetHeight / 2 - 20;
  bullets.push({ element: bullet, worldX: startWorldX, worldY: startWorldY, speed: -15 });
}

function updateBullets() {
  bullets.forEach((b, index) => {
    b.worldX += b.speed;
    b.element.style.left = (b.worldX + bgX) + "px";
    b.element.style.top = b.worldY + "px";

    if (b.worldX + bgX < -50) {
      b.element.remove();
      bullets.splice(index, 1);
      return;
    }

    if (!isHit) {
      const bulletRect = b.element.getBoundingClientRect();
      const bulletPoly = [
        { x: bulletRect.left, y: bulletRect.top },
        { x: bulletRect.right, y: bulletRect.top },
        { x: bulletRect.right, y: bulletRect.bottom },
        { x: bulletRect.left, y: bulletRect.bottom }
      ];
      const playerPoly = getPolygonFromJSON(player, "free");
      if (polygonsCollide(playerPoly, bulletPoly)) {
        handleHit();
        b.element.remove();
        bullets.splice(index, 1);
      }
    }
  });
}

//==============================
// 被弾処理
//==============================
function handleHit() {
  isHit = true;
  result.style.left = player.offsetLeft + "px";
  result.style.top = player.offsetTop + "px";
  result.style.width = player.offsetWidth + "px";
  result.style.height = player.offsetHeight + "px";
  result.classList.add("shake");
  result.style.display = "block";
  player.style.display = "none";

  setTimeout(() => {
    result.style.display = "none";
    result.classList.remove("shake");
    player.style.display = "block";
    isHit = false;
  }, 1000);
}

//==============================
// 入力処理
//==============================
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shootBullet();
  if (isHit) return;
  if (e.key === "ArrowUp") playerY -= 10;
  if (e.key === "ArrowDown") playerY += 10;
  if (e.key === "ArrowLeft") bgX += 10;
  if (e.key === "ArrowRight") bgX -= 10;
  playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
  player.style.top = playerY + "px";
  gameArea.style.backgroundPosition = bgX + "px 0px";
});

//==============================
// マウス操作
//==============================
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
document.addEventListener("mousemove", (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
});

//==============================
// メインループ
//==============================
setInterval(() => {
  if (!gameStarted) return;
  moveEnemy();
  updateBullets();

  if (!isHit) {
    const playerCenterX = playerX + player.offsetWidth / 2;
    const playerCenterY = playerY + player.offsetHeight / 2;
    if (cursorY < playerCenterY - 5) playerY -= 5;
    if (cursorY > playerCenterY + 5) playerY += 5;
    playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
    player.style.top = playerY + "px";

    if (cursorX > playerCenterX + 10) bgX -= 5;
    else if (cursorX < playerCenterX - 10) bgX += 5;
    gameArea.style.backgroundPosition = bgX + "px 0px";
  }

  recognition.onend = () => {
    if (gameStarted) recognition.start();
  };
}, 20);

//==============================
// カウントダウンとゲーム開始
//==============================
function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  let count = 3;
  countdownEl.innerText = count;
  let timer = setInterval(async () => {
    count--;
    if (count > 0) countdownEl.innerText = count;
    else if (count === 0) countdownEl.innerText = "START!";
    else {
      clearInterval(timer);
      countdownEl.style.display = "none";
      gameStarted = true;
      startMainTimer();
      if (!audioContext) await setupAudio();
      recognition.start();
    }
  }, 1000);
}

//==============================
// 音声認識準備
//==============================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) alert("このブラウザは音声認識に対応していません");
else {
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    shootBullet();
  };
  recognition.onerror = (event) => console.error("音声認識エラー:", event.error);
  setupAudio().then(() => startCountdown());
}

//==============================
// マイク設定
//==============================
async function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  microphone = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  microphone.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function getVolume() {
  analyser.getByteFrequencyData(dataArray);
  let values = 0;
  for (let i = 0; i < dataArray.length; i++) values += dataArray[i];
  return values / dataArray.length;
}

//==============================
// タイマー・ゴール・進捗バー
//==============================
let timeLeft = 10;
const timerElement = document.createElement("div");
timerElement.style.position = "absolute";
timerElement.style.top = "20px";
timerElement.style.left = "20px";
timerElement.style.color = "black";
timerElement.style.fontSize = "32px";
timerElement.style.fontFamily = "monospace";
timerElement.style.zIndex = "9999";
timerElement.textContent = `残り時間: ${timeLeft}`;
gameArea.appendChild(timerElement);

// 進捗バー
const progressBarBg = document.createElement("div");
progressBarBg.style.position = "absolute";
progressBarBg.style.bottom = "20px";
progressBarBg.style.left = "50%";
progressBarBg.style.transform = "translateX(-50%)";
progressBarBg.style.width = "400px";
progressBarBg.style.height = "30px";
progressBarBg.style.backgroundColor = "#555";
progressBarBg.style.border = "2px solid #000";
progressBarBg.style.borderRadius = "5px";
progressBarBg.style.zIndex = "9999";
gameArea.appendChild(progressBarBg);

const progressBar = document.createElement("div");
progressBar.style.width = "0%";
progressBar.style.height = "100%";
progressBar.style.backgroundColor = "#0f0";
progressBar.style.borderRadius = "3px";
progressBarBg.appendChild(progressBar);

// ゴール表示
const goal = document.createElement("img");
goal.src = "image/goal.png";
goal.className = "sprite";
goal.style.display = "none";
goal.style.left = "50%";
goal.style.top = "50%";
goal.style.transform = "translate(-50%, -50%)";
goal.style.zIndex = "9999";
gameArea.appendChild(goal);
goal.style.height = window.innerHeight + "px";
goal.style.width = "auto";

const maxScroll = 2000;
let goalReached = false;

function startMainTimer() {
  const timerInterval = setInterval(() => {
    if (isHit) return;

    timeLeft--;
    timerElement.textContent = `残り時間: ${timeLeft}`;

    let progress = Math.min(Math.abs(bgX) / maxScroll * 100, 100);
    progressBar.style.width = progress + "%";

    if (progress >= 100 && !goalReached) {
      goalReached = true;
      goal.style.display = "block";
      clearInterval(timerInterval);
      alert("🎉 ゴール成功！");
    }

    if (timeLeft <= 0 && !goalReached) {
      clearInterval(timerInterval);
      alert("⏰ 時間切れ！失敗です");
    }

  }, 1000);
}
