let dots = [];
let squares = [];
let drawingSquare = false;
let startPoint;
let numDots = 290;
let squareHeight = 700;
let squareWidth = 1100;
let margin = 50;
let collisionCount = 0;
let startTime;
let lastDotChangeTime;
let benchmarkStartTime;
let benchmarkDuration;
let benchmarkResults = [];
let isBenchmarking = true;
let currentBenchmarkPopulation = 290;
let isFirstBenchmark = true;
let fps;
let targetFPS = 30; // The FPS we're simulating
let actualFPS = 30;  // The actual FPS we're running at


let colors = [
  [233, 219, 206], [234, 82, 111], [226, 194, 144], [37, 206, 209], [233, 219, 206], [219, 211, 216], [216, 180, 160], [215, 122, 97], [226, 149, 120],
  [131, 197, 190], [255, 221, 210], [233, 219, 206], [248, 197, 34], [233, 219, 206], [248, 247, 193], [244, 105, 2], [218, 80, 106], [250, 228, 2],
  [228, 34, 104], [251, 128, 117], [249, 180, 171], [253, 235, 211], [199, 65, 123], [245, 72, 127], [201, 173, 167], [242, 233, 228],
  [224, 240, 234], [240, 180, 158], [247, 228, 190], [255, 78, 80], [252, 145, 58], [249, 211, 35], [237, 229, 116], [225, 245, 196], [153, 184, 152],
  [254, 206, 168], [255, 132, 124], [232, 74, 95], [105, 210, 231], [167, 219, 216], [224, 228, 204], [243, 134, 48], [250, 105, 0], [254, 67, 101],
  [252, 157, 154], [249, 205, 173], [200, 200, 169], [131, 175, 155], [236, 208, 120], [255, 107, 107], [224, 142, 121], [241, 212, 175], [236, 229, 206],
  [197, 224, 220], [232, 221, 203], [233, 127, 2], [248, 202, 0], [138, 155, 15], [69, 173, 168], [136, 212, 152], [198, 218, 191], [243, 233, 210],
  [157, 224, 173], [229, 252, 194], [235, 104, 65], [237, 201, 81], [91, 192, 235], [253, 231, 76], [155, 197, 61], [250, 121, 33], [237, 106, 90],
  [244, 241, 187], [155, 193, 188], [92, 164, 169], [230, 235, 224], [239, 71, 111], [255, 209, 102], [6, 214, 160],
];

let collisionMap = new Map();
const COLLISION_COOLDOWN = 30; // frames
const DOT_RADIUS = 10; // Radius of the circle around each dot

function setup() {
  createCanvas(squareWidth + 2 * margin + 200, squareHeight + 2 * margin);
  textAlign(LEFT, TOP);
  frameRate(actualFPS);

  startTime = frameCount;
  lastDotChangeTime = startTime;
  benchmarkStartTime = startTime;
  benchmarkDuration = 5 * 60 * targetFPS; // 5 minutes worth of frames at target FPS

  for (let i = 0; i < numDots; i++) {
    addDot();
  }
}

function draw() {
  background(3);
  fps = frameRate();

  drawBoundaries();
  drawSquares();
  updateAndDrawDots();
  checkForOverlaps();
  displayStats();
  displayBenchmarkResults();

  if (isBenchmarking) {
    let elapsedFrames = frameCount - benchmarkStartTime;
    if (elapsedFrames >= benchmarkDuration) {
      let simulatedSeconds = elapsedFrames / targetFPS;
      let KIps = collisionCount / numDots / simulatedSeconds;
      benchmarkResults.push({ population: numDots, KIps: KIps.toFixed(3) });
      saveResultsToFile();
      
      currentBenchmarkPopulation -= 5; //step
      if (currentBenchmarkPopulation >= 5) {
        adjustDots(currentBenchmarkPopulation);
        benchmarkStartTime = frameCount;
        collisionCount = 0;
        
        if (isFirstBenchmark) {
          benchmarkDuration = 4 * 60 * targetFPS; // 4 minutes worth of frames
          isFirstBenchmark = false;
        }
      } else {
        isBenchmarking = false;
      }
    }
  }
}

class Dot {
  constructor(x, y, targetX, targetY, color, movingRight) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.target = createVector(targetX, targetY);
    this.color = color;
    this.maxSpeed = 0.5;
    this.maxForce = 0.13;
    this.noiseFactor = 0.15;
    this.r = 2;
    this.movingRight = movingRight;
  }

  update(dots, obstacles) {
    this.steerTowardsTarget();
    this.avoidOthers(dots);
    this.avoidObstacles(obstacles);
    this.addNoise();

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

 steerTowardsTarget() {
  let desired = p5.Vector.sub(this.target, this.pos);
  let d = desired.mag();
  if (d < 1) {
    if (this.movingRight) {
      this.target = randomPointOnLeft();
      let h = (26/360 + random(-15, 15)/360) % 1; // Orange hue with variance
      let s = constrain(80/100 + random(-20, 20)/100, 0, 1);
      let l = constrain(50/100 + random(-15, 15)/100, 0, 1);
      this.color = hslToRgb(h, s, l);
    } else {
      this.target = randomPointOnRight();
      let h = (190/360 + random(-15, 15)/360) % 1; // Blue hue with variance
      let s = constrain(80/100 + random(-20, 20)/100, 0, 1);
      let l = constrain(50/100 + random(-15, 15)/100, 0, 1);
      this.color = hslToRgb(h, s, l);
    }
    this.movingRight = !this.movingRight;
  } else {
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }
}
avoidOthers(dots) {
  let distances = [];
  for (let other of dots) {
    if (other !== this) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      distances.push({dot: other, distance: d});
    }
  }
  
  // Sort distances and get the three closest
  distances.sort((a, b) => a.distance - b.distance);
  let closestThree = distances.slice(0, 3);
  
  // Calculate mean distance of three closest dots
  let meanDistance = closestThree.reduce((sum, d) => sum + d.distance, 0) / closestThree.length;
  let sqrtMeanDistance = sqrt(meanDistance);
  
  // Adjust field based on sqrt of mean distance
  let field = 1000 / (sqrt(numDots*20)) + sqrtMeanDistance;
  
  for (let {dot: other, distance: d} of closestThree) {
    if (d < field) {
      let repel = p5.Vector.sub(this.pos, other.pos);
      repel.normalize();
      //repel.mult(this.maxSpeed);
      repel.div(0.5 * d);
      this.applyForce(repel);
    }
  }
}

  avoidObstacles(obstacles) {
    for (let obstacle of obstacles) {
      let obstacleCenter = createVector((obstacle.x1 + obstacle.x2) / 2, (obstacle.y1 + obstacle.y2) / 2);
      let d = dist(this.pos.x, this.pos.y, obstacleCenter.x, obstacleCenter.y);
      let side = dist(obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2) / sqrt(2);
      if (d < side / 2 + 20) {
        let repel = p5.Vector.sub(this.pos, obstacleCenter);
        repel.normalize();
        repel.mult(this.maxSpeed);
        repel.div(d);
        this.applyForce(repel);
      }
    }
  }

  addNoise() {
    let noise = p5.Vector.random2D();
    noise.mult(this.noiseFactor);
    this.applyForce(noise);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.r * 4);
    noFill();
    stroke(this.color);
    ellipse(this.pos.x, this.pos.y, DOT_RADIUS * 2);
  }
}

function displayStats() {
  fill(255);
  noStroke();
  text(`Dots: ${numDots}`, 10, 10);
  text(`Actual FPS: ${fps.toFixed(1)}`, 10, 30);
  text(`Target FPS: ${targetFPS}`, 10, 50);

  text(`Collisions: ${collisionCount}`, 10, 70);
  let currentFrames = frameCount - lastDotChangeTime;
  let simulatedSeconds = currentFrames / targetFPS;
  let KIps = (simulatedSeconds > 0) ? collisionCount / numDots / simulatedSeconds : 0;
  text(`KI/s: ${KIps.toFixed(3)}`, 10, 90);
  
  if (isBenchmarking) {
    let remainingFrames = benchmarkDuration - (frameCount - benchmarkStartTime);
    let remainingSimulatedSeconds = remainingFrames / targetFPS;
    text(`Benchmark Timer: ${formatTime(remainingSimulatedSeconds)}`, 10, 110);
    text(`Current Population: ${currentBenchmarkPopulation}`, 10, 130);
  }
}

function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function displayBenchmarkResults() {
  fill(255);
  noStroke();
  text("Benchmark Results:", width - 190, 10);
  text("Population | KI/s", width - 190, 30);
  for (let i = 0; i < benchmarkResults.length; i++) {
    let result = benchmarkResults[i];
    text(`${result.population.toString().padStart(9)} | ${result.KIps}`, width - 190, 50 + i * 20);
  }
}

function saveResultsToFile() {
  let writer = createWriter('results.txt');
  writer.write("Population,KI/s\n");
  for (let result of benchmarkResults) {
    writer.write(`${result.population},${result.KIps}\n`);
  }
  writer.close();
}

function drawBoundaries() {
  noFill();
  stroke(222);
  line(margin, margin, margin, margin + squareHeight);
  line(margin + squareWidth, margin, margin + squareWidth, margin + squareHeight);
}

function drawSquares() {
  for (let s of squares) {
    fill(20);
    stroke(222);
    push();
    translate((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2);
    rotate(s.angle);
    rectMode(CENTER);
    let side = dist(s.x1, s.y1, s.x2, s.y2) / sqrt(2);
    rect(0, 0, side, side);
    pop();
  }

  if (drawingSquare && startPoint) {
    fill(60, 200);
    stroke(222);
    push();
    translate((startPoint.x + mouseX) / 2, (startPoint.y + mouseY) / 2);
    let angle = atan2(mouseY - startPoint.y, mouseX - startPoint.x);
    rotate(angle);
    rectMode(CENTER);
    let side = dist(startPoint.x, startPoint.y, mouseX, mouseY) / sqrt(2);
    rect(0, 0, side, side);
    pop();
  }
}

function updateAndDrawDots() {
  for (let dot of dots) {
    dot.update(dots, squares);
    dot.display();
  }
}

function checkForOverlaps() {
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      let d = dist(dots[i].pos.x, dots[i].pos.y, dots[j].pos.x, dots[j].pos.y);
      if (d < DOT_RADIUS * 2) {
        let pairKey = `${i}-${j}`;
        if (!collisionMap.has(pairKey) || frameCount - collisionMap.get(pairKey) >= COLLISION_COOLDOWN) {
          collisionCount++;
          collisionMap.set(pairKey, frameCount);
        }
      }
    }
  }
}

function mousePressed() {
  drawingSquare = true;
  startPoint = createVector(mouseX, mouseY);
}

function mouseReleased() {
  if (drawingSquare && startPoint) {
    let angle = atan2(mouseY - startPoint.y, mouseX - startPoint.x);
    squares.push({
      x1: startPoint.x,
      y1: startPoint.y,
      x2: mouseX,
      y2: mouseY,
      angle: angle
    });
  }
  drawingSquare = false;
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function adjustDots(newNumDots) {
  if (newNumDots < numDots) {
    dots.splice(newNumDots);
  } else {
    for (let i = numDots; i < newNumDots; i++) {
      addDot();
    }
  }
  numDots = newNumDots;
  collisionCount = 0;
  lastDotChangeTime = frameCount;
}

function addDot() {
  // Random starting position on the canvas
  let startX = random(margin, margin + squareWidth);
  let startY = random(margin, margin + squareHeight);
  
  // Randomly decide which side the dot will move to
  let movingRight = random() < 0.5;
  // Set the target based on the random direction
  let dest = movingRight ? randomPointOnRight() : randomPointOnLeft();
  // Base HSL values
  let h = movingRight ? 190/360 : 26/360; // 190 for blue, 26 for orange
  
  // Add variance to hue, saturation, and lightness
  h = (h + random(-15, 15)/360) % 1; // Add variance to hue and wrap around 0-1
  let s = constrain(80/100 + random(-20, 20)/100, 0, 1);
  let l = constrain(50/100 + random(-15, 15)/100, 0, 1);

  let color = hslToRgb(h, s, l);
  dots.push(new Dot(startX, startY, dest.x, dest.y, color, movingRight));
}
function randomPointOnLeft() {
  let x = margin;
  let y = random(margin, margin + squareHeight);
  return createVector(x, y);
}

function randomPointOnRight() {
  let x = margin + squareWidth;
  let y = random(margin, margin + squareHeight);
  return createVector(x, y);
}

function randomPointOnLeftOrRight() {
  return (random(1) < 0.5) ? randomPointOnLeft() : randomPointOnRight();
}
