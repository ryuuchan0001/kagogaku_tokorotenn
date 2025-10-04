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

// 敵の上下移動
function moveEnemy() {
  enemyY += enemySpeed;
  if (enemyY <= 0 || enemyY >= window.innerHeight - 100) {
    enemySpeed *= -1;
  }
  enemy.style.top = enemyY + "px";
}

// 弾発射
function shootBullet() {
  const bullet = document.createElement("img");
  bullet.src = "../image/しばる.png";
  bullet.className = "bullet";
  gameArea.appendChild(bullet);

  // 背景基準で位置を記録
  const startWorldX = -bgX + enemy.offsetLeft;
  const startWorldY = enemyY + enemy.offsetHeight / 2 - 20;

  bullets.push({
    element: bullet,
    worldX: startWorldX,
    worldY: startWorldY,
    speed: -5
  });
}

// 弾の更新
function updateBullets() {
  bullets.forEach((b, index) => {
    b.worldX += b.speed; // 背景基準で移動

    // 背景スクロールに合わせて表示位置を変換
    b.element.style.left = (b.worldX + bgX) + "px";
    b.element.style.top = b.worldY + "px";

    // 画面外に出たら削除
    if (b.worldX + bgX < -50) {
      b.element.remove();
      bullets.splice(index, 1);
      return;
    }

    // 当たり判定（プレイヤー）
    if (!isHit) {
      const rectBullet = b.element.getBoundingClientRect();
      const rectPlayer = player.getBoundingClientRect();
      if (
        rectBullet.left < rectPlayer.right &&
        rectBullet.right > rectPlayer.left &&
        rectBullet.top < rectPlayer.bottom &&
        rectBullet.bottom > rectPlayer.top
      ) {
        handleHit();
        b.element.remove();
        bullets.splice(index, 1);
      }
    }
  });
}


// プレイヤーが弾に当たったときの処理
function handleHit() {
  isHit = true;
  result.style.left = player.offsetLeft + "px";
  result.style.top = player.offsetTop + "px";
  result.style.width = player.offsetWidth + "px";
  result.style.height = player.offsetHeight + "px";

  result.classList.add("shake");
  result.style.display = "block";
  player.style.display = "none";

  // 1秒後に元に戻す
  setTimeout(() => {
    result.style.display = "none";
    result.classList.remove("shake");
    player.style.display = "block";
    isHit = false;
  }, 1000);
}

// キーボード入力
document.addEventListener("keydown", (e) => {
  // 弾発射は常に有効
  if (e.key === "Shift") {
    shootBullet();
  }

  // プレイヤー操作禁止中は移動・背景スクロールを無効
  if (isHit) return;

  // 上下移動・背景スクロール
  if (e.key === "ArrowUp") playerY -= 10;
  if (e.key === "ArrowDown") playerY += 10;
  if (e.key === "ArrowLeft") bgX += 10;
  if (e.key === "ArrowRight") bgX -= 10;
  gameArea.style.backgroundPosition = bgX + "px 0px";


  // 上下移動制限
  playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));

  // 反映
  player.style.top = playerY + "px";
  gameArea.style.backgroundPosition = bgX + "px 0px";
});


// マウスの動きに合わせてプレイヤーを移動
document.addEventListener("mousemove", (e) => {
  if (isHit) return; // 被弾中は操作不可

  // プレイヤーの位置をカーソルに合わせる
  playerY = e.clientY - player.offsetHeight / 2;
  
  // 画面内に制限
  playerY = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, playerY));
  
  player.style.top = playerY + "px";
});


//プレイヤーをカーソル移動
// マウスの動きに合わせてプレイヤーを移動
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;

// マウス位置を記録
document.addEventListener("mousemove", (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
});

// メインループ
setInterval(() => {
  if (!gameStarted) return; // カウントダウン中は動かない

  moveEnemy();
  updateBullets();

  if (!isHit) {
    // プレイヤー操作処理
    const playerCenterX = playerX + player.offsetWidth / 2;
    const playerCenterY = playerY + player.offsetHeight / 2;

    // 上下移動（±5pxの停止範囲あり）
    if (cursorY < playerCenterY - 5) playerY -= 5;
    if (cursorY > playerCenterY + 5) playerY += 5;

    // 可動域制御
    const minY = 0;
    const maxY = window.innerHeight - player.offsetHeight;
    playerY = Math.max(minY, Math.min(maxY, playerY));
    player.style.top = playerY + "px";

    // 左右スクロール（±10px停止判定）
    if (cursorX > playerCenterX + 30) {
      bgX -= 5;
    } else if (cursorX < playerCenterX - 30) {
      bgX += 5;
    }
    gameArea.style.backgroundPosition = bgX + "px 0px";
  }
}, 20);

let gameStarted = false;

function startCountdown() {
  const countdownEl = document.getElementById("countdown");
  let count = 3;

  countdownEl.innerText = count;
  let timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.innerText = count;
    } else if (count === 0) {
      countdownEl.innerText = "START!";
    } else {
      clearInterval(timer);
      countdownEl.style.display = "none";
      gameStarted = true; // ゲーム開始
    }
  }, 1000);
}

// 最初にカウントダウンを実行
startCountdown();






// メインループ
setInterval(() => {
  moveEnemy();
  updateBullets();
}, 20);
