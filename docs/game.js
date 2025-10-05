//==============================
// 初期設定
//==============================
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
<<<<<<< HEAD:docs/game.js
let recognition;
let audioContext;
=======
let gameCleared = false;
let goalReached = false;
>>>>>>> sin_goal:docs/js/game.js

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
  ]
};

//==============================
// SAT法による当たり判定
//==============================
function getPolygonFromJSON(element, type) {
  const json = hitboxData[type];
  const rect = element.getBoundingClientRect();

  return json.map(p => ({
    x: rect.left + p.nx * rect.width,
    y: rect.top + p.ny * rect.height
  }));
}

function projectPolygon(polygon, axis) {
  const dots = polygon.map(p => (p.x * axis.x + p.y * axis.y));
  return [Math.min(...dots), Math.max(...dots)];
}

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
<<<<<<< HEAD:docs/game.js

function projectPolygon(polygon, axis) {
  const dots = polygon.map(p => (p.x * axis.x + p.y * axis.y));
  return [Math.min(...dots), Math.max(...dots)];
}
=======
>>>>>>> sin_goal:docs/js/game.js

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
  bullet.src = "../image/bind.png";
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

<<<<<<< HEAD:docs/game.js
    // ==== 当たり判定（ポリゴン同士） ====
    if (!isHit) {
=======
    if (!isHit && !gameCleared) {
>>>>>>> sin_goal:docs/js/game.js
      const bulletRect = b.element.getBoundingClientRect();
      const bulletPoly = [
        {x: bulletRect.left, y: bulletRect.top},
        {x: bulletRect.right, y: bulletRect.top},
        {x: bulletRect.right, y: bulletRect.bottom},
        {x: bulletRect.left, y: bulletRect.bottom}
      ];
      const playerPoly = getPolygonFromJSON(player, "free");
      if (polygonsCollide(playerPoly, bulletPoly)) {
        handleHit();
        b.element.remove();
        bullets.splice(index, 1);
      };
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
// 入力・マウス処理
//==============================
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shootBullet();
  if (isHit || gameCleared) return;
  if (e.key === "ArrowUp") playerY -= 10;
  if (e.key === "ArrowDown") playerY += 10;
  if (e.key === "ArrowLeft") bgX += 10;
  if (e.key === "ArrowRight") bgX -= 10;
  playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
  player.style.top = playerY + "px";
  gameArea.style.backgroundPosition = bgX + "px 0px";
});

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
document.addEventListener("mousemove", (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
});

//==============================
// ゴール設定
//==============================

const goal = document.createElement("img");
goal.src = "../image/ゴール.png";
goal.className = "sprite";
goal.style.display = "none";
goal.style.position = "absolute";
goal.style.top = "50%";
goal.style.left = "90%";
goal.style.transform = "translateY(-50%)";
goal.style.zIndex = "1";
goal.style.opacity = "1";
gameArea.appendChild(goal);

function updateGoalPosition() {
  goal.style.left = `${window.innerWidth - 200 + bgX}px`; 
}

//==============================
// クリア・勝利メッセージ
//==============================
const clearMessage = document.createElement("div");
clearMessage.style.position = "absolute";
clearMessage.style.top = "50%";
clearMessage.style.left = "50%";
clearMessage.style.transform = "translate(-50%, -50%)";
clearMessage.style.fontSize = "64px";
clearMessage.style.color = "yellow";
clearMessage.style.fontFamily = "monospace";
clearMessage.style.display = "none";
clearMessage.style.zIndex = "9999";
clearMessage.textContent = "🎉 勝利！！ 🎉";
gameArea.appendChild(clearMessage);

//==============================
// スクロール距離表示
//==============================
const scrollDisplay = document.createElement("div");
scrollDisplay.style.position = "absolute";
scrollDisplay.style.top = "20px";
scrollDisplay.style.right = "20px";
scrollDisplay.style.fontSize = "24px";
scrollDisplay.style.fontFamily = "monospace";
scrollDisplay.style.color = "red";
scrollDisplay.style.zIndex = "9999";
scrollDisplay.textContent = "距離: 0 / 1000"; // 初期表示
gameArea.appendChild(scrollDisplay);

// ゴールまでの距離(px換算)
const goalDistance = 1000; 

let scrollCount = 0;
let prevBgX = bgX; // 前フレームのbgX

//==============================
// メインループ
//==============================
setInterval(() => {
  if (!gameStarted || gameCleared) return;

  moveEnemy();
  updateBullets();

  if (!isHit) {
    const playerCenterX = playerX + player.offsetWidth / 2;
    const playerCenterY = playerY + player.offsetHeight / 2;

    if (cursorY < playerCenterY - 5) playerY -= 5;
    if (cursorY > playerCenterY + 5) playerY += 5;
    playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
    player.style.top = playerY + "px";

    if (cursorX > playerCenterX + 10) bgX -= 5; // 右スクロール
    else if (cursorX < playerCenterX - 10) bgX += 5; // 左スクロール
    gameArea.style.backgroundPosition = bgX + "px 0px";

    // スクロール量の更新（左に進むと増え、右に戻ると減る）
    let delta = prevBgX - bgX; 
    scrollCount += delta; 
    prevBgX = bgX;

    // 距離表示
    let distance = Math.max(0, Math.floor(scrollCount));
    distance = Math.min(distance, goalDistance); // ゴールを超えない
    scrollDisplay.textContent = `距離: ${distance} / ${goalDistance}`;

    // ゴール到達判定（スクロール距離ベース）
    if (distance >= goalDistance && !gameCleared) {
      gameCleared = true;
      clearMessage.style.display = "block";

      goal.style.display = "block";
      updateGoalPosition();
      goal.style.opacity = "0.4";
      goal.style.filter = "brightness(0.8)";
      console.log("🎉 ゴール到達！勝利！！");
    }
  }
}, 20);

//==============================
<<<<<<< HEAD:docs/game.js
// カウントダウンと残り時間タイマ-
// カウントダウンとゲーム開始
//==============================
function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  let count = 3;
  countdownEl.innerText = count;
  let timer = setInterval(async() => {
    count--;
    if (count > 0) countdownEl.innerText = count;
    else if (count === 0) countdownEl.innerText = "START!";
    else {
      clearInterval(timer);
      countdownEl.style.display = "none";
      gameStarted = true;

      //音声認識スタート
      if (!audioContext) {
        await setupAudio();
      }
      recognition.start();
      console.log("音声認識スタート");
    }
  }, 1000);
}

//==============================
// 音声認識の準備（SpeechRecognitionの初期化）
//==============================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert("このブラウザは音声認識に対応していません");
} else {
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    console.log("認識結果:", transcript);
    
      shootBullet();
  };

  recognition.onerror = (event) => {
    console.error("音声認識エラー:", event.error);
  };

  // 音声認識と音量解析の準備ができたら、ゲーム開始
  setupAudio().then(() => {
    console.log("マイクと音声認識の準備完了");
    startCountdown();
  });
}

//==============================
// 音声入力用マイク設定
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
  for (let i = 0; i < dataArray.length; i++) {
    values += dataArray[i];
  }
  return values / dataArray.length;
}

//==============================
// カウントダウンとゲーム開始
//==============================
function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  let count = 3;
  countdownEl.innerText = count;
  let timer = setInterval(() => {
    count--;
    if (count > 0) countdownEl.innerText = count;
    else if (count === 0) countdownEl.innerText = "START!";
    else {
      clearInterval(timer);
      countdownEl.style.display = "none";
      gameStarted = true;

      // 🎤 音声認識スタート
      recognition.start();
      console.log("音声認識スタート");
    }
  }, 1000);
}



//==============================
// タイマー・ゴール表示
=======
// タイマー関連（完全修正版）
>>>>>>> sin_goal:docs/js/game.js
//==============================

<<<<<<< HEAD:docs/game.js
// タイマー表示（最初から表示）

=======
// タイマー表示
let timeLeft = 10;
>>>>>>> sin_goal:docs/js/game.js
const timerElement = document.createElement("div");
timerElement.style.position = "absolute";
timerElement.style.top = "20px";
timerElement.style.left = "20px";
timerElement.style.color = "red";
timerElement.style.fontSize = "32px";
timerElement.style.fontFamily = "monospace";
timerElement.style.zIndex = "9999";
timerElement.textContent = `残り時間: ${timeLeft}`;
gameArea.appendChild(timerElement);

<<<<<<< HEAD:docs/game.js
// ゴール表示

const goal = document.createElement("img");
goal.src = "../image/ゴール.png";
goal.className = "sprite";
goal.style.display = "none";
goal.style.left = "50%";
goal.style.top = "50%";
goal.style.transform = "translate(-50%, -50%)";
goal.style.zIndex = "9999";
gameArea.appendChild(goal);
=======
// グローバルタイマー変数
let timerInterval = null;
>>>>>>> sin_goal:docs/js/game.js

//------------------------------
// カウントダウン（3,2,1,START）
//------------------------------
function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  let count = 3;
  countdownEl.innerText = count;

  const countdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.innerText = count;
    } else if (count === 0) {
      countdownEl.innerText = "START!";
    } else {
      clearInterval(countdownTimer);
      countdownEl.style.display = "none";
      gameStarted = true;

      // ★ ゲーム開始後に1回だけタイマーを起動
      if (!timerInterval) startGameTimer();
    }
  }, 1000);
}
<<<<<<< HEAD:docs/game.js
=======
startCountdown();

//------------------------------
// 残り時間タイマー
//------------------------------
function startGameTimer() {
  timerInterval = setInterval(() => {
    if (isHit || gameCleared) return;

    // タイマーを減らす
    timeLeft--;

    // 表示更新
    timerElement.textContent = `残り時間: ${timeLeft}`;

    // タイムアップ判定
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null; // ← 再実行防止
      timeLeft = 0; // ← 表示を0で止める
      timerElement.textContent = `残り時間: 0`;

      // ゴール出現
      goal.style.display = "block";
      updateGoalPosition();
    }
  }, 1000);
}


>>>>>>> sin_goal:docs/js/game.js

