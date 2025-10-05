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
let gameCleared = false;
let goalReached = false;

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

    if (!isHit && !gameCleared) {
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
goal.src = "../image/goal.png";

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
// タイマー関連（完全修正版）
//==============================

// タイマー表示
let timeLeft = 10;
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

// グローバルタイマー変数
let timerInterval = null;

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


//==============================
// 障害物関連
//==============================
let obstacles = [];
const obstacleSpeed = 2;
const obstacleSpawnInterval = 2500; // 2.5秒ごとに出現

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
      triggerKnockback(); // ← 後退アニメーション呼び出し
    }
  }
}

function triggerKnockback() {
  isHit = true; // 後退中は操作禁止
  const knockbackDistance = 100; // 後退距離
  const duration = 1000; // ミリ秒（1秒で後退）
  const steps = 50; // アニメーション分割数
  const movePerStep = knockbackDistance / steps;
  const interval = duration / steps;

  let step = 0;

  const knockbackTimer = setInterval(() => {
    bgX += movePerStep; // 背景を少しずつ右へ動かす
    gameArea.style.backgroundPosition = `${bgX}px 0px`;
    step++;

    // 終了判定
    if (step >= steps) {
      clearInterval(knockbackTimer);
      isHit = false; // 操作再開
    }
  }, interval);
}


// 一定間隔で障害物を出現させる
setInterval(() => {
  if (gameStarted && !isHit) spawnObstacle();
}, obstacleSpawnInterval);


