let csvURL = "https://docs.google.com/spreadsheets/d/1CNRa3SFgQ2UZskMK-1pIm11OzQ2DUHgBBOEFCKtZs4o/edit?usp=sharing"; // 設定Google試算表發布後的CSV網址

let table; // 儲存從Google試算表讀取到的資料表

let allQuestions = []; // 儲存Google試算表中的完整題庫
let questions = []; // 儲存本次測驗使用的五題
let currentQuestion = 0; // 記錄目前正在作答的題目編號
let score = 0; // 記錄目前得到的分數
let answered = false; // 記錄目前題目是否已經作答
let selectedAnswer = -1; // 記錄玩家選擇的答案
let showResult = false; // 記錄是否顯示答題結果
let gameFinished = false; // 記錄測驗是否全部結束
let shaking = false; // 記錄畫面是否正在震動
let shakeStart = 0; // 記錄畫面震動開始的時間
let confetti = []; // 建立彩帶粒子的陣列
let loading = true; // 記錄題庫是否正在載入
let loadError = false; // 記錄題庫是否載入失敗

async function setup() { // p5.js初始化函式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗大小的畫布
  textFont("Arial"); // 設定文字使用Arial字型
  rectMode(CENTER); // 設定矩形以中心點作為定位
  textAlign(CENTER, CENTER); // 設定文字水平與垂直置中

  try { // 嘗試讀取Google試算表
    table = await loadTable(csvURL, "csv", "header"); // 等待Google試算表CSV完整載入

    if (!table || table.getRowCount() === 0) { // 如果沒有成功取得任何資料
      throw new Error("Google試算表沒有資料"); // 主動產生錯誤
    } // 結束資料存在判斷

    let requiredColumns = ["question", "option1", "option2", "option3", "option4", "answer"]; // 設定必須存在的欄位名稱

    for (let column of requiredColumns) { // 逐一檢查每一個必要欄位
      if (!table.columns.includes(column)) { // 如果找不到指定欄位
        throw new Error("找不到欄位：" + column); // 主動產生錯誤
      } // 結束欄位檢查
    } // 結束所有欄位檢查

    for (let r = 0; r < table.getRowCount(); r++) { // 逐列讀取Google試算表
      let questionText = table.getString(r, "question").trim(); // 取得題目文字
      let option1 = table.getString(r, "option1").trim(); // 取得第一個選項
      let option2 = table.getString(r, "option2").trim(); // 取得第二個選項
      let option3 = table.getString(r, "option3").trim(); // 取得第三個選項
      let option4 = table.getString(r, "option4").trim(); // 取得第四個選項
      let answerText = table.getString(r, "answer").trim(); // 取得正確答案編號文字
      let answerNumber = Number(answerText); // 將正確答案轉換成數字

      if (questionText !== "" && option1 !== "" && option2 !== "" && option3 !== "" && option4 !== "" && answerNumber >= 1 && answerNumber <= 4) { // 確認這一列資料完整且正確
        allQuestions.push({ // 將這一題加入完整題庫
          question: questionText, // 儲存題目文字
          options: [option1, option2, option3, option4], // 儲存四個選項
          answer: answerNumber - 1 // 將試算表的1到4轉成程式使用的0到3
        }); // 完成單一題目的建立
      } // 結束資料格式檢查
    } // 結束讀取所有題目的迴圈

    if (allQuestions.length === 0) { // 如果沒有任何有效題目
      throw new Error("沒有有效的題目資料"); // 主動產生錯誤
    } // 結束有效題目判斷

    startNewQuiz(); // 從完整題庫建立第一次測驗
    loading = false; // 設定題庫載入完成
  } catch (error) { // 如果Google試算表讀取失敗
    console.error(error); // 將詳細錯誤顯示在瀏覽器主控台
    loading = false; // 停止載入狀態
    loadError = true; // 開啟載入錯誤狀態
  } // 結束錯誤處理
} // setup函式結束

function startNewQuiz() { // 建立一次新的測驗
  let shuffledQuestions = shuffle([...allQuestions]); // 複製完整題庫並將題目順序隨機打亂
  questions = shuffledQuestions.slice(0, min(5, shuffledQuestions.length)); // 從完整題庫取最多五題
  currentQuestion = 0; // 將題目回到第一題
  score = 0; // 將分數歸零
  answered = false; // 重置作答狀態
  selectedAnswer = -1; // 清除答案選擇
  showResult = false; // 關閉結果顯示
  gameFinished = false; // 關閉測驗完成狀態
  shaking = false; // 關閉畫面震動
  confetti = []; // 清除畫面上剩餘的彩帶
} // startNewQuiz函式結束

function draw() { // p5.js每一幀都會執行的函式
  background("#A9DEF9"); // 設定整個畫面的背景顏色

  if (loading) { // 如果題庫正在載入
    fill("#333333"); // 設定載入文字顏色
    noStroke(); // 移除文字外框
    textSize(min(width * 0.04, 28)); // 根據螢幕寬度設定載入文字大小
    text("題庫載入中...", width / 2, height / 2); // 顯示題庫載入中的提示
    return; // 暫停後面的畫面繪製
  } // 結束題庫載入判斷

  if (loadError) { // 如果題庫載入失敗
    fill("#333333"); // 設定錯誤文字顏色
    noStroke(); // 移除文字外框
    textSize(min(width * 0.035, 24)); // 根據螢幕寬度設定錯誤文字大小
    text("題庫載入失敗", width / 2, height * 0.43); // 顯示題庫載入失敗
    textSize(min(width * 0.025, 18)); // 設定錯誤說明文字大小
    text("請確認Google試算表CSV網址與欄位名稱", width / 2, height * 0.53); // 顯示錯誤說明
    return; // 暫停後面的畫面繪製
  } // 結束題庫錯誤判斷

  if (questions.length === 0) { // 如果沒有讀取到任何題目
    fill("#333333"); // 設定錯誤文字顏色
    noStroke(); // 移除文字外框
    textSize(min(width * 0.04, 28)); // 根據螢幕寬度設定錯誤文字大小
    text("目前沒有可使用的題目。", width / 2, height / 2); // 顯示沒有題目的提示
    return; // 暫停後面的畫面繪製
  } // 結束題目數量判斷

  let offsetX = 0; // 設定畫面水平震動位移
  let offsetY = 0; // 設定畫面垂直震動位移

  if (shaking) { // 如果目前正在震動畫面
    let elapsed = millis() - shakeStart; // 計算震動已經持續多久

    if (elapsed < 350) { // 如果震動時間還不到350毫秒
      offsetX = random(-12, 12); // 隨機產生水平震動
      offsetY = random(-12, 12); // 隨機產生垂直震動
    } else { // 如果震動已經結束
      shaking = false; // 關閉震動狀態
    } // 結束震動時間判斷
  } // 結束震動判斷

  push(); // 儲存目前畫布狀態
  translate(offsetX, offsetY); // 將整個內容套用震動位移

  if (gameFinished) { // 如果五題都已經完成
    drawFinalScreen(); // 顯示最後的成績畫面
  } else { // 如果測驗還沒有結束
    drawQuestion(); // 顯示目前的題目
  } // 結束畫面判斷

  pop(); // 恢復畫布狀態

  drawConfetti(); // 更新並繪製彩帶
} // draw函式結束

function drawQuestion() { // 繪製題目畫面
  let q = questions[currentQuestion]; // 取得目前題目的資料

  fill("#FFFFFF"); // 設定題號文字顏色
  noStroke(); // 移除文字外框
  textSize(min(width * 0.035, 24)); // 根據螢幕寬度適度縮小題號文字
  text("第 " + (currentQuestion + 1) + " 題 / " + questions.length, width / 2, height * 0.12); // 顯示目前題號

  fill("#333333"); // 設定題目文字顏色
  textSize(min(width * 0.035, 34)); // 根據螢幕寬度適度縮小題目文字
  text(q.question, width / 2, height * 0.24); // 顯示題目內容

  let boxWidth = min(width * 0.65, 600); // 設定選項框寬度
  let boxHeight = 65; // 設定選項框高度
  let gap = 85; // 設定選項之間的垂直距離
  let startY = height * 0.38; // 設定第一個選項的垂直位置

  for (let i = 0; i < 4; i++) { // 依序繪製四個選項
    let x = width / 2; // 設定選項水平位置
    let baseY = startY + i * gap; // 計算選項的原始垂直位置
    let y = baseY; // 儲存目前選項的垂直位置

    if (answered && i === q.answer && selectedAnswer !== q.answer) { // 如果答錯且目前是正確答案
      y += sin(frameCount * 0.12) * 8; // 讓正確答案上下晃動
    } // 結束正確答案晃動判斷

    let optionColor = "#FFFFFF"; // 預設選項為白色

    if (answered && i === selectedAnswer && selectedAnswer !== q.answer) { // 如果這是玩家選錯的答案
      optionColor = "#FF5D8F"; // 將錯誤答案設定成粉紅色
    } // 結束錯誤答案顏色判斷

    if (answered && i === q.answer) { // 如果這是正確答案
      optionColor = "#AACC00"; // 將正確答案設定成綠色
    } // 結束正確答案顏色判斷

    fill(optionColor); // 設定選項框顏色
    stroke("#FFFFFF"); // 設定選項框白色外框
    strokeWeight(3); // 設定選項框外框粗細
    rect(x, y, boxWidth, boxHeight, 18); // 繪製四角圓弧的選項框

    fill("#333333"); // 設定選項文字顏色
    noStroke(); // 移除文字外框
    textSize(min(width * 0.032, 24)); // 根據螢幕寬度適度縮小選項文字
    text(q.options[i], x, y); // 顯示選項內容
  } // 結束四個選項的迴圈

  if (answered) { // 如果玩家已經作答
    if (currentQuestion === questions.length - 1) { // 如果目前是最後一題
      fill("#FFFFFF"); // 設定看分數按鈕顏色
      stroke("#FFFFFF"); // 設定按鈕外框顏色
      strokeWeight(3); // 設定按鈕外框粗細
      rect(width / 2, height * 0.91, 230, 60, 18); // 繪製看分數按鈕

      fill("#333333"); // 設定按鈕文字顏色
      noStroke(); // 移除文字外框
      textSize(min(width * 0.03, 22)); // 根據螢幕寬度適度縮小按鈕文字
      text("看分數", width / 2, height * 0.91); // 顯示看分數文字
    } else { // 如果不是最後一題
      fill("#333333"); // 設定提示文字顏色
      textSize(min(width * 0.03, 22)); // 根據螢幕寬度適度縮小提示文字
      text("點擊空白處進入下一題", width / 2, height * 0.91); // 顯示點擊空白處的提示
    } // 結束最後一題判斷
  } // 結束作答後提示判斷
} // drawQuestion函式結束

function drawFinalScreen() { // 繪製最後成績畫面
  fill("#333333"); // 設定標題文字顏色
  noStroke(); // 移除文字外框
  textSize(min(width * 0.07, 70)); // 根據螢幕寬度適度縮小標題文字
  text("測驗完成！", width / 2, height * 0.28); // 顯示測驗完成文字

  textSize(min(width * 0.055, 55)); // 根據螢幕寬度適度縮小分數文字
  text("你的總分：" + score + " / " + questions.length, width / 2, height * 0.42); // 顯示玩家總分

  textSize(min(width * 0.035, 26)); // 根據螢幕寬度適度縮小重新測驗提示
  text("要再測驗一次嗎？", width / 2, height * 0.58); // 顯示重新測驗詢問

  fill("#FFFFFF"); // 設定重新測驗按鈕顏色
  stroke("#FFFFFF"); // 設定按鈕外框顏色
  strokeWeight(3); // 設定按鈕外框粗細
  rect(width / 2, height * 0.70, 230, 70, 20); // 繪製重新測驗按鈕

  fill("#333333"); // 設定按鈕文字顏色
  noStroke(); // 移除文字外框
  textSize(min(width * 0.034, 25)); // 根據螢幕寬度適度縮小按鈕文字
  text("再測驗一次", width / 2, height * 0.70); // 顯示重新測驗文字
} // drawFinalScreen函式結束

function mousePressed() { // 當滑鼠被按下時執行
  if (loading || loadError || questions.length === 0) { // 如果題庫還沒準備好
    return; // 不執行任何點擊操作
  } // 結束題庫狀態判斷

  if (gameFinished) { // 如果目前位於最後成績畫面
    if (dist(mouseX, mouseY, width / 2, height * 0.70) < 120) { // 判斷是否點擊重新測驗按鈕
      startNewQuiz(); // 從完整題庫重新抽取題目
    } // 結束重新測驗按鈕判斷
    return; // 結束這次滑鼠事件
  } // 結束測驗完成判斷

  let q = questions[currentQuestion]; // 取得目前題目的資料

  let boxWidth = min(width * 0.65, 600); // 設定選項框寬度
  let boxHeight = 65; // 設定選項框高度
  let gap = 85; // 設定選項之間的距離
  let startY = height * 0.38; // 設定第一個選項的垂直位置

  if (!answered) { // 如果目前還沒有作答
    for (let i = 0; i < 4; i++) { // 檢查四個選項
      let y = startY + i * gap; // 計算目前選項的垂直位置

      if (mouseX > width / 2 - boxWidth / 2 && mouseX < width / 2 + boxWidth / 2 && mouseY > y - boxHeight / 2 && mouseY < y + boxHeight / 2) { // 判斷是否點擊選項
        selectedAnswer = i; // 記錄玩家選擇的答案
        answered = true; // 將題目設定成已作答
        showResult = true; // 開啟答題結果顯示

        if (selectedAnswer === q.answer) { // 如果玩家答對
          score++; // 分數增加一分
          createConfetti(); // 產生一批彩帶
        } else { // 如果玩家答錯
          shaking = true; // 開啟畫面震動
          shakeStart = millis(); // 記錄震動開始時間
        } // 結束答案判斷

        return; // 完成點擊選項後結束函式
      } // 結束選項碰撞判斷
    } // 結束四個選項的迴圈
  } else { // 如果目前已經作答
    if (currentQuestion === questions.length - 1) { // 如果目前是最後一題
      if (mouseX > width / 2 - 115 && mouseX < width / 2 + 115 && mouseY > height * 0.91 - 30 && mouseY < height * 0.91 + 30) { // 判斷是否點擊看分數按鈕
        nextQuestion(); // 顯示最後分數
      } // 結束看分數按鈕判斷
    } else { // 如果不是最後一題
      let blankAreaTop = height * 0.82; // 設定空白區域的上界
      let blankAreaBottom = height; // 設定空白區域的下界

      if (mouseY > blankAreaTop && mouseY < blankAreaBottom) { // 判斷是否點擊下方空白區域
        nextQuestion(); // 進入下一題
      } // 結束空白區域判斷
    } // 結束最後一題判斷
  } // 結束是否已作答判斷
} // mousePressed函式結束

function nextQuestion() { // 進入下一題或顯示分數的函式
  if (currentQuestion < questions.length - 1) { // 如果還有下一題
    currentQuestion++; // 題目編號增加一
    answered = false; // 重置作答狀態
    selectedAnswer = -1; // 清除上一題選擇
    showResult = false; // 關閉答題結果
  } else { // 如果已經完成最後一題
    gameFinished = true; // 開啟測驗完成狀態
  } // 結束題目判斷
} // nextQuestion函式結束

function createConfetti() { // 建立彩帶的函式
  for (let i = 0; i < 70; i++) { // 一次產生70個彩帶
    let piece = { // 建立單個彩帶物件
      x: random(width * 0.25, width * 0.75), // 設定彩帶隨機水平位置
      y: -random(20, 150), // 設定彩帶從畫面上方開始
      size: random(7, 14), // 設定彩帶大小
      speedY: random(2, 5), // 設定彩帶下落速度
      speedX: random(-2, 2), // 設定彩帶水平速度
      rotation: random(TWO_PI), // 設定彩帶初始旋轉角度
      rotationSpeed: random(-0.08, 0.08), // 設定彩帶旋轉速度
      color: random(["#FF5D8F", "#AACC00", "#FFFFFF", "#FFCF56", "#7B61FF", "#FF8C42"]) // 隨機設定彩帶顏色
    }; // 結束彩帶物件
    confetti.push(piece); // 將彩帶加入彩帶陣列
  } // 結束彩帶產生迴圈
} // createConfetti函式結束

function drawConfetti() { // 更新並繪製彩帶
  for (let i = confetti.length - 1; i >= 0; i--) { // 從最後一個彩帶開始處理
    let c = confetti[i]; // 取得目前彩帶

    c.x += c.speedX; // 更新彩帶水平位置
    c.y += c.speedY; // 更新彩帶垂直位置
    c.speedY += 0.04; // 模擬重力讓彩帶越掉越快
    c.rotation += c.rotationSpeed; // 更新彩帶旋轉角度

    push(); // 儲存目前畫布狀態
    translate(c.x, c.y); // 移動到彩帶位置
    rotate(c.rotation); // 旋轉彩帶
    fill(c.color); // 設定彩帶顏色
    noStroke(); // 移除彩帶外框
    rect(0, 0, c.size, c.size * 1.8); // 繪製彩帶
    pop(); // 恢復畫布狀態

    if (c.y > height + 30) { // 如果彩帶已經掉到畫面最下面
      confetti.splice(i, 1); // 將彩帶從陣列中刪除
    } // 結束彩帶刪除判斷
  } // 結束彩帶迴圈
} // drawConfetti函式結束

function windowResized() { // 當瀏覽器視窗大小改變時執行
  resizeCanvas(windowWidth, windowHeight); // 讓畫布跟著視窗大小重新調整
} // windowResized函式結束