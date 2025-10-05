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
let isRecognizing = false;

// ★ ゴール関連統一管理
const goalDistance = 2200;
let distanceMoved = 0;
let goalAppeared = false;
let goalReached = false;
let goalX = window.innerWidth + 200;
let goalY = window.innerHeight / 2 - 100;

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
// 敵の動き・弾処理
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

  bullets.push({
    element: bullet,
    worldX: startWorldX,
    worldY: startWorldY,
    speed: -15
  });
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

    // ==== 当たり判定（ポリゴン同士） ====
    if (!isHit) {
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
// 入力処理
//==============================
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") shootBullet();
  if (isHit) return;

  if (e.key === "ArrowUp") playerY -= 10;
  if (e.key === "ArrowDown") playerY += 10;
  if (e.key === "ArrowLeft") moveBackground("right");
  if (e.key === "ArrowRight") moveBackground("left");

  playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
  player.style.top = playerY + "px";
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
  updateObstacles();

  if (!isHit) {
    const playerCenterX = playerX + player.offsetWidth / 2;
    const playerCenterY = playerY + player.offsetHeight / 2;

    if (cursorY < playerCenterY - 5) playerY -= 5;
    if (cursorY > playerCenterY + 5) playerY += 5;
    playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
    player.style.top = playerY + "px";

    if (cursorX > playerCenterX + 10) moveBackground("left");
    else if (cursorX < playerCenterX - 10) moveBackground("right");
  }

  // === ゴール判定 ===
  if (goalAppeared && !goalReached && distanceMoved >= goalDistance) {
    goalReached = true;
    gameStarted = false;
    goal.style.animation = "pulse 1s infinite";
    recognition.stop(); // ★音声認識停止
    alert("🎉 ゴール！クリアおめでとう！");
  }

}, 20);

//==============================
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
      startMainTimer()

      //音声認識スタート
      if (!audioContext) {
        await setupAudio();
      }
      if(!isRecognizing){
        recognition.start();
      }
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
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    const isFinal = event.results[event.results.length -1].isFinal;
    console.log("認識結果:", transcript,"(final:",isFinal,")");
      shootBullet();
  };

  recognition.onstart = () => {
    if(!isRecognizing){
      isRecognizing = true;
      console.log("音声認識開始");
    }
  };

  recognition.onerror = (event) => {
    console.error("音声認識エラー:", event.error);
    if (event.error === "aborted") {
      // 一旦止める（start を呼ばない）
      isRecognizing = false;
      return;
    }

    // 他のエラーは再起動させる
    recognition.stop();

  };
  recognition.onend = () => {
    console.warn("音声認識ストップ（自動再起動）");
    isRecognizing = false;
    if (gameStarted) {
      // 少し遅らせて再スタート（クラッシュ防止）
      setTimeout(() => {
        if (!isRecognizing) {
          try {
            recognition.start();
            console.log("音声認識再スタート");
          } catch (e) {
            console.error("音声認識再スタート失敗:", e);
          }
        }
    }, 500);  

 
    }
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
/*
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
      startMainTimer();

      // 🎤 音声認識スタート
      recognition.start();
      console.log("音声認識スタート");
    }
  }, 1000);
}
*/


//==============================
// タイマー・ゴール表示
//==============================
let timeLeft = 100; // ★延長
const timerElement = document.createElement("div");
timerElement.style.position = "fixed"; // ★スクロール影響防止
timerElement.style.top = "20px";
timerElement.style.left = "20px";
timerElement.style.color = "brack";
timerElement.style.fontSize = "32px";
timerElement.style.fontFamily = "monospace";
timerElement.style.zIndex = "9999";
timerElement.textContent = `残り時間: ${timeLeft}`;
gameArea.appendChild(timerElement);

// 進捗バー
const progressBarBg = document.createElement("div");
progressBarBg.style.position = "fixed";
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
progressBar.style.transition = "width 0.2s linear";
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
goal.style.height = window.innerHeight + "px"; // 画面の高さに合わせる
goalY = goal.style.height;
goal.style.width = "auto"; // 比率を保つ

const maxScroll = 2000;

//==============================
// タイマー処理
//==============================
function startMainTimer() {
  const timerInterval = setInterval(() => {
    if (isHit || goalReached) return;

    timeLeft--;
    timerElement.textContent = `残り時間: ${timeLeft}`;

    // ゴールまで残り50pxくらいで満タンに見せる補正
const buffer = 128; // ゴール直前でバーを満タンにする距離
let progress = Math.min((distanceMoved / (goalDistance - buffer)) * 100, 100);
progressBar.style.width = progress + "%";

    // ★時間切れ
    if (timeLeft <= 0 && !goalReached) {
      clearInterval(timerInterval);
      recognition.stop(); // ★追加
      alert("⏰ 時間切れ！失敗です");
      gameStarted = false;
    }
  }, 1000);
}

//==============================
// 背景移動とゴール同期
//==============================
function moveBackground(direction) {
  if (goalReached) return;

  if (direction === "left") {
    bgX -= 5;
    distanceMoved += 5;
  } else if (direction === "right") {
    bgX += 5;
    distanceMoved = Math.max(0, distanceMoved - 5);
  }

  gameArea.style.backgroundPosition = bgX + "px 0px";

  if (!goalAppeared && distanceMoved >= 800) {
    goalAppeared = true;
    goal.style.display = "block";
    goalX = goalDistance;
  }

  if (goalAppeared) {
   goal.style.left = `${goalX - distanceMoved}px`; // ★スクロール連動で表示
    goal.style.top = `${goalY}px`;
  }
}

//==============================
// 障害物関連
//==============================
let obstacles = [];
const obstacleSpeed = 3;
const obstacleSpawnInterval = 2000;

function spawnObstacle() {
  const obstacle = document.createElement("img");
  obstacle.src = "image/obstacle.png";
  obstacle.className = "sprite obstacle";
  obstacle.style.width = "80px";
  obstacle.style.height = "80px";
  obstacle.style.position = "absolute";
  obstacle.style.pointerEvents = "none";
  gameArea.appendChild(obstacle);

  const startX = -bgX + window.innerWidth + 100;
  const startY = Math.random() * (window.innerHeight - 100);

  obstacles.push({
    element: obstacle,
    worldX: startX,
    y: startY
  });
}

function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.worldX -= obstacleSpeed;
    const screenX = o.worldX + bgX;
    o.element.style.left = screenX + "px";
    o.element.style.top = o.y + "px";

    if (screenX < -100) {
      o.element.remove();
      obstacles.splice(i, 1);
      continue;
    }

    const rectO = o.element.getBoundingClientRect();
    const rectP = player.getBoundingClientRect();
    if (
      rectO.left < rectP.right &&
      rectO.right > rectP.left &&
      rectO.top < rectP.bottom &&
      rectO.bottom > rectP.top
    ) {
      o.element.remove();
      obstacles.splice(i, 1);
      animateGoalRetreat()
      triggerKnockback(); // ← 後退アニメーション呼び出し
    }
  }
}

setInterval(() => {
  if (gameStarted && !isHit) spawnObstacle();
}, obstacleSpawnInterval);

function triggerKnockback() {
  isHit = true; // 後退中は操作禁止
  const knockbackDistance = 500; // 後退距離
  const duration = 1000; // ミリ秒（1秒で後退）
  const steps = 50; // アニメーション分割数
  const movePerStep = knockbackDistance / steps;
  const interval = duration / steps;
  

  let step = 0;

  const knockbackTimer = setInterval(() => {
    bgX += movePerStep; // 背景を少しずつ右へ動かす
    distanceMoved -= movePerStep;
    if(distanceMoved < 0) distanceMoved = 0;
    gameArea.style.backgroundPosition = `${bgX}px 0px`;
    step++;
    if (step >= steps) {
      clearInterval(knockbackTimer);
      isHit = false;
    }
  }, interval);
}

// ==============================
// ゴールが遠ざかるアニメーション
// ==============================
function animateGoalRetreat() {
  if (!goalAppeared) return; // ゴールが出ていないなら何もしない

  const retreatDistance = 500; // 逃げる距離(px)
  const duration = 1000; // アニメーション時間(ms)
  const frames = 50; // フレーム数
  const step = retreatDistance / frames;
  const interval = duration / frames;

  let frame = 0;
  const retreatAnimation = setInterval(() => {
    goalX += step; // ゴールを右方向に移動
    goal.style.left = goalX + "px";
    frame++;
    if (frame >= frames) clearInterval(retreatAnimation);
  }, interval);
}
