let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let gesture = "";
let faceImage; // 用於存放臉部圖片
let faceMask; // 用於存放裁剪後的臉部圖片

function preload() {
  // 載入臉部圖片
  faceImage = loadImage("7104050.jpg");
}

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, modelReady);
  handpose.on('predict', results => {
    handPredictions = results;
    detectGesture();
  });
}

function modelReady() {
  console.log("Facemesh 模型載入完成");
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 繪製裁剪後的臉部圖片
    drawFaceMask(keypoints);

    // 根據手勢在臉部繪製三角形
    if (gesture === "scissors") {
      drawTriangle(keypoints[10]); // 額頭
    } else if (gesture === "paper") {
      drawTriangle(keypoints[1]); // 鼻子
    } else if (gesture === "rock") {
      drawTriangle(keypoints[234]); // 左耳
    }
  }
}

function drawFaceMask(keypoints) {
  if (keypoints.length > 0) {
    // 使用臉部輪廓點來建立遮罩
    const faceOutline = [
      keypoints[234], // 左臉頰
      keypoints[93],  // 左眉毛下方
      keypoints[132], // 左眼外側
      keypoints[58],  // 左鼻翼
      keypoints[172], // 下巴
      keypoints[136], // 右鼻翼
      keypoints[361], // 右眼外側
      keypoints[323], // 右眉毛下方
      keypoints[454]  // 右臉頰
    ];

    // 建立遮罩圖形
    let mask = createGraphics(width, height);
    mask.fill(255);
    mask.noStroke();
    mask.beginShape();
    for (let point of faceOutline) {
      mask.vertex(point[0], point[1]);
    }
    mask.endShape(CLOSE);

    // 將遮罩應用到臉部圖片
    faceMask = faceImage.get();
    faceMask.mask(mask);

    // 計算臉部圖片的位置和大小
    const leftCheek = keypoints[234];
    const rightCheek = keypoints[454];
    const nose = keypoints[1];

    const faceWidth = dist(leftCheek[0], leftCheek[1], rightCheek[0], rightCheek[1]);
    const faceHeight = faceWidth * 1.2; // 假設臉的高度是寬度的 1.2 倍

    const faceX = nose[0] - faceWidth / 2;
    const faceY = nose[1] - faceHeight / 2;

    // 繪製裁剪後的臉部圖片
    image(faceMask, faceX, faceY, faceWidth, faceHeight);
  }
}

function drawTriangle(position) {
  const [x, y] = position;
  fill(0, 0, 255);
  noStroke();
  triangle(x, y - 20, x - 10, y + 10, x + 10, y + 10);
}

function detectGesture() {
  if (handPredictions.length > 0) {
    const landmarks = handPredictions[0].landmarks;

    // 簡單的手勢辨識邏輯
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const thumbToIndex = dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]);
    const indexToMiddle = dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]);

    if (thumbToIndex > 50 && indexToMiddle > 50) {
      gesture = "scissors"; // 剪刀
    } else if (thumbToIndex < 30 && indexToMiddle < 30) {
      gesture = "rock"; // 石頭
    } else {
      gesture = "paper"; // 布
    }
  }
}
