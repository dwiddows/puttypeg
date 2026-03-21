/**
 * Implements the axis rendering and projection canvases, including click and drag interactions.
 * So far there are exactly two canvases, and this is hard-coded: the first has only one axis,
 * and the second starts with two and has the option of adding more.
 * Some of the helper functions are hard-coded with this difference in mind.
 */
let margin = 40;
let cfg1;
let cfg2;

// Setup fixed image resources and vars for checking this.
let ket0 = new Image(), ket0Loaded = false;
let ket1 = new Image(), ket1Loaded = false;
ket0.onload = function() { ket0Loaded = true; }
ket1.onload = function() { ket1Loaded = true; }
ket0.src = './ket_0.jpeg';
ket1.src = './ket_1.jpeg';

// Transforms coordinate in the range [-1, 1] to screen coordinate.
function screenCoord(canvas, coord) {
  return margin / 2 + 0.5 * (canvas.width - margin) * (1 + coord);
}

// Transforms screen coordinate to coordinate in the range [-1, 1].
function unitCoord(canvas, coord) {
  return (2 * (coord - margin / 2) / (canvas.width - margin)) - 1;
}

/**
 * Setup operations
 */
 window.onload = function() {
  let canvas1 = document.getElementById("canvas1");
  cfg1 = new CanvasConfig(canvas1, 1, null);

  let canvas2 = document.getElementById("canvas2");
  cfg2 = new CanvasConfig(canvas2, 2, "axisCounter");

  for (const cfg of [cfg1, cfg2]) {
    let canvas = cfg.canvas;

    canvas.onmousedown = e => canvasClick(cfg, e);
    canvas.onmouseup = e => stopDragging(cfg, e);
    canvas.onmouseout = e => stopDragging(cfg, e);
    canvas.onmousemove = e => mouseMoveHover(cfg, e);
    canvas.onmouseover = e => growTargetCircle(cfg, e);

    // For mobile (touchmove) to handle dragging
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault(); // Prevent scrolling while dragging
        // Handle touchmove event here
    });

    for (let axis = 0; axis < cfg.numInitialProjectionAxes; axis++) {
      addRandomAxis(cfg);
    }
    drawAll(cfg);
  }
}

// This array holds the circles representing the projection axes.
class CanvasConfig {
  constructor(canvas, numInitialProjectionAxes, axisCounterElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.axisCounterElement = axisCounterElement;
    this.numInitialProjectionAxes = numInitialProjectionAxes;
    this.projectionAxes = [];
    this.selectedAxis = null;
    this.isDragging = false;
    this.hoveredAxis = null;
  }

  logToConsole = function() {
    for (var key in this){
      console.log(key + ": " + this[key]);
    }
  }
}

// This class stores the details for a single circle.
class Circle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.isSelected = false;
  }
}

/**
 * Returns a shallow copy of the given point, with x and y coordinates
 * projected onto the given axis.
 */
function pointProjectedToAxis(point, axis) {
  newPoint = Object.assign({}, point);
  newPoint.x = axis.x * axis.x * point.x + axis.x * axis.y * point.y;
  newPoint.y = axis.x * axis.y * point.x + axis.y * axis.y * point.y;
  return newPoint;
}

function addRandomAxis(cfg) {
  let radius = 8;
  // First axis is given, the rest are random.
  let angle = cfg.projectionAxes.length == 0 ? 2 * Math.PI / 3 : Math.random() * Math.PI;
  let x = Math.sin(angle);
  let y = Math.cos(angle);
  let circle = new Circle(x, y, radius, "blue");
  cfg.projectionAxes.push(circle);
}

/**
 * Drawing operations
 */
function drawAll(cfg) {
  let canvas = cfg.canvas;
  cfg.ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFixedAxes(cfg);
  drawProjectionAxes(cfg);
  drawBasisStatesAndProjections(cfg);
  if (cfg.axisCounterElement) {
    document.getElementById(cfg.axisCounterElement).innerHTML = projectionAxes.length;
  }
};

function drawFixedAxes(cfg) {
  let ctx = cfg.ctx;
  let canvas = cfg.canvas;
  if (!ket0Loaded || !ket1Loaded) {
    return;
  }
  ctx.strokeStyle = "black";
  ctx.drawImage(ket0, screenCoord(canvas, 1) - 35, screenCoord(canvas, 0) + 15);
  ctx.drawImage(ket1, screenCoord(canvas, 0) + 15, 15);

  ctx.beginPath();
  ctx.moveTo(screenCoord(canvas, 0), screenCoord(canvas, -1));
  ctx.lineTo(screenCoord(canvas, 0), screenCoord(canvas, 1));
  ctx.moveTo(screenCoord(canvas, -1), screenCoord(canvas, 0));
  ctx.lineTo(screenCoord(canvas, 1), screenCoord(canvas,0));
  ctx.stroke();
}

function drawCircle(cfg, circle) {
  let ctx = cfg.ctx;
  let canvas = cfg.canvas;
  ctx.beginPath();
  ctx.arc(screenCoord(canvas, circle.x), screenCoord(canvas, circle.y), circle.radius, 0, Math.PI*2);
  ctx.fillStyle = circle.color;
  if (circle.isSelected && cfg.isDragging) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = circle.radius / 2;
  }
  ctx.fill();
  ctx.stroke();
}

function drawCross(cfg, circle) {
  let ctx = cfg.ctx;
  let canvas = cfg.canvas;
  let radius = circle.radius;
  let x = screenCoord(canvas, circle.x);
  let y = screenCoord(canvas, circle.y);
  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - radius * circle.x, y - radius * circle.y);
  ctx.lineTo(x + radius * circle.x, y + radius * circle.y);
  ctx.moveTo(x - radius * circle.y, y + radius * circle.x);
  ctx.lineTo(x + radius * circle.y, y - radius * circle.x);
  ctx.stroke();
}

function drawProjectionAxes(cfg) {
  let ctx = cfg.ctx;
  let canvas = cfg.canvas;
  projectionAxes = cfg.projectionAxes;
  let initialAlpha = ctx.globalAlpha;
  let lightestAlpha = 0.2 + 0.5 ** projectionAxes.length;
  for(let i = 0; i < projectionAxes.length; i++) {
    ctx.globalAlpha = lightestAlpha + (i / (projectionAxes.length - 1)) * (initialAlpha - lightestAlpha);
    let circle = projectionAxes[i];
    ctx.strokeStyle = circle.color;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(screenCoord(canvas, circle.x), screenCoord(canvas, circle.y));
    ctx.lineTo(screenCoord(canvas, -circle.x), screenCoord(canvas, -circle.y));
    ctx.stroke();
    ctx.setLineDash([]);

    drawCircle(cfg, circle);
    drawCross(cfg,circle);
    ctx.lineWidth = 1;
  }
  ctx.globalAlpha = initialAlpha;
}

function drawBasisStatesAndProjections(cfg) {
  let yCircle = new Circle(0, -1, 6, "green");
  drawCircleAndProjections(cfg, yCircle);
  let xCircle = new Circle(1, 0, 6, "red");
  drawCircleAndProjections(cfg, xCircle)
}

function drawCircleAndProjections(cfg, circle) {
  let ctx = cfg.ctx;
  let canvas = cfg.canvas;
  ctx.setLineDash([3, 5]);
  for (let i = 0; i < projectionAxes.length; i++) {
    newCircle = pointProjectedToAxis(circle, projectionAxes[i]);
    ctx.strokeStyle = circle.color;
    ctx.beginPath();
    ctx.moveTo(screenCoord(canvas, circle.x), screenCoord(canvas, circle.y));
    ctx.lineTo(screenCoord(canvas, newCircle.x), screenCoord(canvas, newCircle.y));
    ctx.fill();
    ctx.stroke();
    drawCircle(cfg, circle);
    circle = newCircle;
  }
  circle.radius = circle.radius * 1.2;
  drawCircle(cfg, circle);
  ctx.setLineDash([]);
}

/**
 * Event handling functions for click-and-drag interaction.
 */
function findActivatedCircle(cfg, e) {
  let canvas = cfg.canvas;
  let clickX = unitCoord(canvas, e.pageX - canvas.offsetLeft);
  let clickY = unitCoord(canvas, e.pageY - canvas.offsetTop);

  for(let i = 0; i < projectionAxes.length; i++) {
    let circle = projectionAxes[i];
    let distanceFromCenter = Math.sqrt((circle.x - clickX)**2 + (circle.y - clickY)**2);
    if (distanceFromCenter <= circle.radius * 2 / canvas.width) {
      return circle;
    }
  }
  return null;
}

function canvasClick(cfg, e) {
  let selectedCircle = findActivatedCircle(cfg, e);
  if (selectedCircle != null) {
    cfg.selectedAxis = selectedCircle;
    cfg.selectedAxis.isSelected = true;
    cfg.isDragging = true;
  }
}

function growTargetCircle(cfg, e) {
  let hoveredAxis = findActivatedCircle(cfg, e);
  if (hoveredAxis != null) {
    newCircle = Object.assign({}, hoveredAxis);
    newCircle.radius = 2 * hoveredAxis.radius;
    drawCircle(cfg, newCircle);
    drawCross(cfg, newCircle);
  } else {
    drawAll(cfg);
  }
}

function stopDragging(cfg) {
  cfg.isDragging = false;
  if (cfg.selectedAxis) {
    cfg.selectedAxis.isSelected = false;
  }
  drawAll(cfg)
}

function mouseMoveHover(cfg, e) {
  dragProjectionAxis(cfg, e);
  if (!cfg.isDragging) {
    growTargetCircle(cfg, e);
  }
}

function dragProjectionAxis(cfg, e) {
  let canvas = cfg.canvas;
  if (cfg.isDragging && cfg.selectedAxis != null) {
    let x = unitCoord(canvas, e.pageX - canvas.offsetLeft);
    let y = unitCoord(canvas, e.pageY - canvas.offsetTop);
    norm = Math.sqrt(x*x + y*y);
    cfg.selectedAxis.x = x / norm;
    cfg.selectedAxis.y = y / norm;
    drawAll(cfg);
  }
}

function removeLastAxis() {
  cfg2.projectionAxes.pop();
  drawAll(cfg2);
}

function addAxis() {
  addRandomAxis(cfg2);
  drawAll(cfg2);
}
