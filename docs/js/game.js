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
// タイマー・ゴール設定
//==============================
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

    if (cursorX > playerCenterX + 10) bgX -= 5;
    else if (cursorX < playerCenterX - 10) bgX += 5;
    gameArea.style.backgroundPosition = bgX + "px 0px";

    if (timeLeft <= 0) {
      goal.style.display = "block";
      updateGoalPosition();
    }

    // ゴール到達判定
   if (goal.style.display === "block" && !gameCleared) {
      // 背景に追従してゴール座標を正確に更新
      const goalWorldX = -bgX + (window.innerWidth - 200); // 実際の背景上のゴール位置
      const playerWorldX = -bgX + playerX;

      // プレイヤーがゴール領域に到達したか
      if (playerWorldX + player.offsetWidth >= goalWorldX) {

        // 背景と同化（演出）
        goal.style.opacity = "0.4";
        goal.style.filter = "brightness(0.8)";

        // 勝利処理
        gameCleared = true;
        clearMessage.style.display = "block";

        // サウンドやアニメなど追加したければここに入れる
        console.log("🎉 ゴール到達！勝利！！");
      }
    }
  }
}, 20);

//==============================
// カウントダウン
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
    }
  }, 1000);
}
startCountdown();

//==============================
// タイマー更新
//==============================
const timerInterval = setInterval(() => {
  if (isHit || gameCleared) return;
  timeLeft--;
  timerElement.textContent = `残り時間: ${timeLeft}`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    goal.style.display = "block";
  }
}, 1000);
