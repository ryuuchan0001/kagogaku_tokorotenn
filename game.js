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
        console.log("音声認識スタート");
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
    isRecognizing = true;
    console.log("音声認識開始");
  };

  recognition.onerror = (event) => {
    console.error("音声認識エラー:", event.error);
  };
  recognition.onend = () => {
    console.warn("音声認識ストップ（自動再起動）");
    isRecognizing = false;
    if (gameStarted) {
      // 少し遅らせて再スタート（クラッシュ防止）
      setTimeout(() => {
      try {
        recognition.start();
        console.log("音声認識再スタート");
      } catch (e) {
        console.error("音声認識再スタート失敗:", e);
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
let timeLeft = 30;
const timerElement = document.createElement("div");
timerElement.style.position = "absolute";
timerElement.style.top = "20px";
timerElement.style.left = "20px";
timerElement.style.color = "brack";
timerElement.style.fontSize = "32px";
timerElement.style.fontFamily = "monospace";
timerElement.style.zIndex = "9999";
timerElement.textContent = `残り時間: ${timeLeft}`;
gameArea.appendChild(timerElement);

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
goal.style.width = "auto"; // 比率を保つ

const maxScroll = 2200;
let goalReached = false;

// 残り時間タイマー本処理
function startMainTimer() {
  const timerInterval = setInterval(() => {
    if (isHit) return;
    timeLeft--;
    timerElement.textContent = `残り時間: ${timeLeft}`;

    let progress = Math.min(Math.abs(bgX) / maxScroll * 100, 100);
    progressBar.style.width = progress + "%";

    if (goalAppeared && distanceMoved >= 2200) {
      goalReached = true;
      goal.style.display = "block";
    }
  }, 1000);
}

// ==============================
// ゴール出現と背景連動
// ==============================
let distanceMoved = 0;     // プレイヤーが進んだ距離
let goalAppeared = false;  // ゴール出現フラグ
let goalX = window.innerWidth + 200; // 初期ゴール位置（画面外）
let goalY = window.innerHeight / 2 - 100;

// 背景移動関数（カーソル移動時に呼び出す）
function moveBackground(direction) {
  if (direction === "left") {
    bgX -= 5;
    distanceMoved += 5; // 進んだ距離を加算
  } else if (direction === "right") {
    bgX += 5;
    distanceMoved = Math.max(0, distanceMoved - 5); // 後退時に減算
  }

  // 背景スクロール
  gameArea.style.backgroundPosition = bgX + "px 0px";

  // === ゴール出現判定 ===
  if (!goalAppeared && distanceMoved >= 800) {
    goalAppeared = true;
    goal.style.display = "block";
    goal.style.position = "absolute";
    goal.style.left = "50%";
    goal.style.top = "50%";
    //goal.style.top = goalY + "px";
    goalX = window.innerWidth; // 画面右端に登場
    goal.style.left = goalX + "px";
  }

  // === ゴールを背景と一緒に動かす ===
  if (goalAppeared) {
    if (direction === "left") {
      goalX -= 5; // 背景と一緒に左に移動
    } else if (direction === "right") {
      goalX += 5; // 背景を戻すとき右に移動
    }
    goal.style.left = goalX + "px";
  }
}
//==============================
// 障害物関連
//==============================
let obstacles = [];
const obstacleSpeed = 3;
const obstacleSpawnInterval = 2000; // 2秒ごとに出現

// 障害物生成（背景基準の位置に生成）
function spawnObstacle() {
  const obstacle = document.createElement("img");
  obstacle.src = "image/obstacle.png";
  obstacle.className = "sprite obstacle";
  obstacle.style.width = "80px";
  obstacle.style.height = "80px";
  obstacle.style.position = "absolute";
  obstacle.style.pointerEvents = "none";
  gameArea.appendChild(obstacle);

  // 背景上の座標（背景基準）
  const startX = -bgX + window.innerWidth + 100; // 背景上の右端に出す
  const startY = Math.random() * (window.innerHeight - 100);

  obstacles.push({
    element: obstacle,
    worldX: startX, // 背景基準でのX位置
    y: startY
  });
}

// 障害物の更新（背景に合わせて動く）
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];

    // 背景上での位置を更新
    o.worldX -= obstacleSpeed;

    // 実際の画面上での描画位置を計算
    const screenX = o.worldX + bgX;
    o.element.style.left = screenX + "px";
    o.element.style.top = o.y + "px";

    // 背景左端より左に出たら削除
    if (screenX < -100) {
      o.element.remove();
      obstacles.splice(i, 1);
      continue;
    }

    // ===== 当たり判定 =====
    const rectO = o.element.getBoundingClientRect();
    const rectP = player.getBoundingClientRect();
    if (
      rectO.left < rectP.right &&
      rectO.right > rectP.left &&
      rectO.top < rectP.bottom &&
      rectO.bottom > rectP.top
    ) {
      // 衝突処理
      o.element.remove();
      obstacles.splice(i, 1);
      animateGoalRetreat()
      triggerKnockback(); // ← 後退アニメーション呼び出し
    }
  }
}

// 2秒ごとに障害物を出現
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

    // 終了判定
    if (step >= steps) {
      clearInterval(knockbackTimer);
      isHit = false; // 操作再開
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
