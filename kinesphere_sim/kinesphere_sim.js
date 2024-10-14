let dots = [];
let squares = [];
let drawingSquare = false;
let startPoint;
let numDots = 50;
let squareHeight = 700;
let squareWidth = 1100;
let margin = 50;
let slider;
let collisionCount = 0;
let startTime;
let lastDotChangeTime;
let colors = [
[233, 219, 206], [234, 82, 111], [226, 194, 144], [37, 206, 209], [233, 219, 206], [219, 211, 216], [216, 180, 160], [215, 122, 97], [226, 149, 120],  
[131, 197, 190], [255, 221, 210], [233, 219, 206],  [248, 197, 34], [233, 219, 206], [248, 247, 193], [244, 105, 2], [218, 80, 106], [250, 228, 2], 
[228, 34, 104], [251, 128, 117], [249, 180, 171], [253, 235, 211], [199, 65, 123], [245, 72, 127], [201, 173, 167], [242, 233, 228],
[224, 240, 234], [240, 180, 158], [247, 228, 190], [255, 78, 80], [252, 145, 58], [249, 211, 35], [237, 229, 116], [225, 245, 196], [153, 184, 152], 
[254, 206, 168], [255, 132, 124], [232, 74, 95], [105, 210, 231], [167, 219, 216], [224, 228, 204], [243, 134, 48], [250, 105, 0], [254, 67, 101], 
[252, 157, 154], [249, 205, 173], [200, 200, 169], [131, 175, 155], [236, 208, 120], [255, 107, 107], [224, 142, 121], [241, 212, 175], [236, 229, 206], 
[197, 224, 220], [232, 221, 203], [233, 127, 2], [248, 202, 0], [138, 155, 15], [69, 173, 168], [136, 212, 152], [198, 218, 191], [243, 233, 210],
[157, 224, 173], [229, 252, 194], [235, 104, 65], [237, 201, 81], [91, 192, 235], [253, 231, 76], [155, 197, 61], [250, 121, 33], [237, 106, 90], 
[244, 241, 187], [155, 193, 188], [92, 164, 169], [230, 235, 224], [239, 71, 111], [255, 209, 102], [6, 214, 160],  
];

let collisionBuffer; // Graphics buffer for storing collision overlaps

function setup() {
  createCanvas(squareWidth + 2 * margin, squareHeight + 2 * margin);
  textAlign(LEFT, TOP);
  slider = createSlider(10, 300, numDots, 1);
  slider.position(10, 10);
  collisionBuffer = createGraphics(width, height);
  collisionBuffer.background(12); // Set initial background
  
  startTime = millis();
  lastDotChangeTime = startTime;
  
  for (let i = 0; i < numDots; i++) {
    addDot();
  }
}

function draw() {
  background(3); // Clear the main canvas

  // Draw the faint red collisions from the buffer
  image(collisionBuffer, 0, 0);

  // Draw the vertical lines
  noFill();
  stroke(222);
  line(margin, margin, margin, margin + squareHeight);
  line(margin + squareWidth, margin, margin + squareWidth, margin + squareHeight);

  // Draw all placed squares
  for (let s of squares) {
    fill(20);
    stroke(222);

    push(); // Begin new drawing state
    translate((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2); // Move origin to the center of the square
    rotate(s.angle); // Rotate the square
    rectMode(CENTER); // Draw the square from its center
    let side = dist(s.x1, s.y1, s.x2, s.y2) / sqrt(2); // Calculate the side length of the square
    rect(0, 0, side, side);
    pop(); // Restore original drawing state
  }

  // Draw the currently drawing square
  if (drawingSquare && startPoint) {
    fill(60, 200);
    stroke(222);

    push(); // Begin new drawing state
    translate((startPoint.x + mouseX) / 2, (startPoint.y + mouseY) / 2); // Move origin to the center of the square
    let angle = atan2(mouseY - startPoint.y, mouseX - startPoint.x);
    rotate(angle); // Rotate the square
    rectMode(CENTER); // Draw the square from its center
    let side = dist(startPoint.x, startPoint.y, mouseX, mouseY) / sqrt(2); // Calculate the side length of the square
    rect(0, 0, side, side);
    pop(); // Restore original drawing state
  }

  // Update and display each dot
  for (let dot of dots) {
    dot.update(dots);
  }

  // Check for overlaps and draw the faint red on the buffer
  checkForOverlaps();

  for (let dot of dots) {
    dot.display();
    dot.showGoal();
  }

  // Display number of dots, collision count, and KI/s
  fill(255);
  noStroke();
  text(`Dots: ${numDots}`, slider.x * 2 + slider.width, 10);
  text(`Collisions: ${collisionCount}`, slider.x * 2 + slider.width + 100, 10);
  let currentTime = (millis() - lastDotChangeTime) / 1000; // seconds since last dot change
  let KIps = (currentTime > 0) ? collisionCount / numDots / currentTime : 0;
  text(`KI/s: ${KIps.toFixed(2)}`, slider.x * 2 + slider.width + 250, 10);

  // Update dots based on slider value
  if (slider.value() !== numDots) {
    adjustDots(slider.value());
  }
}

function mousePressed() {
  // Start drawing a new square
  drawingSquare = true;
  startPoint = createVector(mouseX, mouseY);
}

function mouseReleased() {
  // Place the square
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

function checkForOverlaps() {
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      let d = dist(dots[i].pos.x, dots[i].pos.y, dots[j].pos.x, dots[j].pos.y);
      if (d < 11) { // Check if circles overlap
        collisionCount++;
        //collisionBuffer.fill(dots[i].color[0], dots[i].color[1], dots[i].color[2], 20); // Color from first dot
         collisionBuffer.fill(255, 30); // Color from first dot
        collisionBuffer.noStroke();
        collisionBuffer.ellipse((dots[i].pos.x + dots[j].pos.x) / 2, (dots[i].pos.y + dots[j].pos.y) / 2, 3);
      }
    }
  }
}

function adjustDots(newNumDots) {
  if (newNumDots < numDots) {
    dots.splice(newNumDots);  // Reduce dots to new amount
  } else {
    for (let i = numDots; i < newNumDots; i++) {
      addDot();
    }
  }
  numDots = newNumDots;
  collisionCount = 0;
  lastDotChangeTime = millis();
}

function addDot() {
  let color = random(colors);
  let startLoc = randomPointOnLeftOrRight();
  let dest = (startLoc.x === margin) ? randomPointOnRight() : randomPointOnLeft();
  dots.push(new Dot(startLoc.x, startLoc.y, dest.x, dest.y, color));
}

// Helper functions to get random points on the left or right side of the square
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

// Modify to get a random point either on the left or right side
function randomPointOnLeftOrRight() {
  return (random(1) < 0.5) ? randomPointOnLeft() : randomPointOnRight();
}

class Dot {
  constructor(x, y, targetX, targetY, color) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.target = createVector(targetX, targetY);
    this.color = color;
    this.maxSpeed = 1.2;
    this.maxForce = 0.1;
    this.noiseFactor = 0.2; // Noise factor for randomness
    this.r = 2; // 4 pixels wide
  }

  update(dots) {
    // Steer towards target
    let desired = p5.Vector.sub(this.target, this.pos);
    let d = desired.mag();
    if (d < 1) {
      if (this.target.x == margin + squareWidth) {
        this.target = randomPointOnLeft();
      } else if (this.target.x == margin) {
        this.target = randomPointOnRight();
      }
    } else {
      desired.setMag(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      this.applyForce(steer);
    }

    // Avoid other dots
    for (let other of dots) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < 35) {
          let flee = p5.Vector.sub(this.pos, other.pos);
          flee.setMag(this.maxSpeed);
          flee.mult(1 / d); // Closer dots have stronger effect
          this.applyForce(flee);
        }
      }
    }

    // Predict and avoid squares
    for (let s of squares) {
      let futurePos = p5.Vector.add(this.pos, this.vel);
      let centerX = (s.x1 + s.x2) / 2;
      let centerY = (s.y1 + s.y2) / 2;
      let side = dist(s.x1, s.y1, s.x2, s.y2) / sqrt(2);

      let relativeX = futurePos.x - centerX;
      let relativeY = futurePos.y - centerY;

      let angle = -s.angle;
      let rotatedX = cos(angle) * relativeX - sin(angle) * relativeY;
      let rotatedY = sin(angle) * relativeX + cos(angle) * relativeY;

      if (abs(rotatedX) < side / 2 && abs(rotatedY) < side / 2) {
        let flee = p5.Vector.sub(this.pos, createVector(centerX, centerY));
        flee.setMag(this.maxSpeed);
        flee.mult(1 / flee.mag());
        this.applyForce(flee);
      }
    }

    // Add some noise and randomness to their movement
    this.vel.x += random(-this.noiseFactor, this.noiseFactor);
    this.vel.y += random(-this.noiseFactor, this.noiseFactor);

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  display() {
    fill(this.color);
    noStroke();

    // Draw the dot
    ellipse(this.pos.x, this.pos.y, this.r * 4);

    // Draw the circles around the dot
    noFill();
    //stroke(90);
    stroke(this.color);
    ellipse(this.pos.x, this.pos.y, 22); // 10 pixels radius, diameter 20 pixels
  }

  showGoal() {
    fill(this.color);
    noStroke();
    ellipse(this.target.x, this.target.y, 12);
  }
}
