let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let gesture = "";

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
  console.log("模型載入完成");
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 畫臉部五官的點
    drawFacialKeypoints(keypoints);

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

function drawFacialKeypoints(keypoints) {
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);

  // 畫出臉部五官的點
  for (let i = 0; i < keypoints.length; i++) {
    const [x, y] = keypoints[i];
    ellipse(x, y, 5, 5);
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
