//Defined constants
var undo_check = 1;
var redo_check = 1;
var drawer_check = 1;
const canvas1 = document.getElementById('canvas1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');
const toolbox = document.getElementById('toolbox');
var imageArray = [];


document.onload = onload_initial();


//function on document loading

function onload_initial() {
  resize();
  //Setting up for normal drawing
  enableDrawing();
  document.getElementById("strokecolor").addEventListener("input", stroke_properties, { passive: true });
  document.getElementById("strokewidth").addEventListener("input", stroke_properties, { passive: true });
  document.getElementById("pagecontainer").style.cursor = "url('board icons/Pen_cursor.png'),auto";
  setup();
}

//setting the size of canvas
function resize() {
  //saving original image
  var original = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  //resizing the canvas
  canvas1.width = window.innerWidth * (0.45);
  canvas1.height = window.innerHeight * (0.80);
  //filling the canvas with a background color
  canvas1.style.backgroundColor = '#ffffff';
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
  //placing the image back on to this canvas
  ctx1.putImageData(original, 0, 0, 0, 0, canvas1.width, canvas1.height);
}


//adding the evend listeners on mouse events for drawing

function enableDrawing() {
  canvas1.addEventListener("mousedown", start_draw);
  canvas1.addEventListener("mousemove", draw);
  canvas1.addEventListener("mouseup", stop_draw);
  canvas1.addEventListener("mouseup", auxillary_stop_draw);
  canvas1.addEventListener("mouseout", stop_draw);
}

//removing the event listeners on mouse for free drawing
function disable_setup() {

  canvas1.removeEventListener("mousedown", start_draw);
  canvas1.removeEventListener("mousemove", draw);
  canvas1.removeEventListener("mouseup", stop_draw);
  canvas1.removeEventListener("mouseup", auxillary_stop_draw);
  canvas1.removeEventListener("mouseout", stop_draw);
}

//initial settings for toolbox and canvas
function setup() {
  toolbox.style.height = (window.innerHeight * 0.80);
  canvas1.style.backgroundColor = '#ffffff';
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
  update_page_image();
}




//drawing pre-requisites
var currentPoint = { x: 0, y: 0 };
var controlPoint = { x: 0, y: 0 };   //for quadratic curve

//to get the x and y of mouse event
async function locator(event) {
  currentPoint.x = event.clientX - canvas1.offsetLeft;
  currentPoint.y = event.clientY - canvas1.offsetTop;
}

//drawing functions
var stroke = false;
var strokeWidth, strokeColor;

//setting the brush type and color
async function stroke_properties(ctx) {
  ctx.lineCap = 'round';
  strokeWidth = document.getElementById('strokewidth').value;
  ctx.lineWidth = strokeWidth;
  strokeColor = document.getElementById('strokecolor').value;
  ctx.strokeStyle = strokeColor;
  ctx.lineJoin = 'round';
}


async function start_draw(event) {
  event.preventDefault();
  locator(event);
  stroke_properties(ctx1);
  stroke = true;
}

async function auxillary_stop_draw() {
  stroke = false;
  update_page_image();
  socket.emit('stopdrawing');
}

async function stop_draw(event) {
  stroke = false;
}



var loc_prev;
async function draw(event) {
  if (!stroke) { return; }
  //begining new path 
  ctx1.beginPath();

  //storing for sockets
  loc_prev = currentPoint;

  ctx1.moveTo(currentPoint.x, currentPoint.y);
  //console.log(currentPoint);

  controlPoint.x = currentPoint.x;
  controlPoint.y = currentPoint.y;
  //new piece
  locator(event);
  controlPoint.x = (controlPoint.x + currentPoint.x) / 2;
  controlPoint.y = (controlPoint.y + currentPoint.y) / 2;

  locator(event);

  ctx1.quadraticCurveTo(controlPoint.x, controlPoint.y, currentPoint.x, currentPoint.y);
  // console.log(controlPoint);
  // console.log(currentPoint);
  ctx1.stroke();
  ctx1.closePath();

  socket.emit('drawing', { loc_prev, currentPoint, controlPoint, strokeWidth, strokeColor });
}

// draw function for other than drawer 
async function draw1(data) {
  //console.log(data);
  currentPoint = data.currentPoint;
  controlPoint = data.controlPoint;
  if (!stroke) { return; }
  ctx1.beginPath();
  ctx1.moveTo(data.loc_prev.x, data.loc_prev.y);
  //console.log("yes");
  ctx1.quadraticCurveTo(controlPoint.x, controlPoint.y, currentPoint.x, currentPoint.y);
  ctx1.stroke();
  ctx1.closePath();

}

//clear page logic 

var clear_check = 1;
function clear_page(cntx_name) {
  imageArray = [];
  imageArray_index = 0;
  buttonState();
  //clearing the canvas
  cntx_name.clearRect(0, 0, canvas1.width, canvas1.height);
  cntx_name.fillStyle = '#ffffff';
  cntx_name.fillRect(0, 0, canvas1.width, canvas1.height);
  //updating the image
  update_page_image()

  if (clear_check == 1) {
    //emiting the same to other user if they are not drawer
    socket.emit("clearCanvas");
  }
  //reseting check
  clear_check = 1;
}




//rectangle drawing 
var rect_check = false;
async function start_rect_drawing() {
  if (rect_check) {
    check_tools();
    return;
  }
  check_tools();
  document.getElementById("pagecontainer").style.cursor = 'crosshair';
  //adding event listeners 
  canvas2.addEventListener("mousedown", start_rect);
  canvas2.addEventListener("mousemove", draw_rect);
  canvas2.addEventListener("mouseup", stop_rect);

  //setting width of canvas
  canvas2.width = window.innerWidth * (0.45);
  canvas2.height = window.innerHeight * (0.80);
  canvas2.style.opacity = 1;
  canvas2.style.visibility = 'visible';
  rect_check = true;
}

async function stop_rect_drawing() {
  canvas2.width = 0;
  canvas2.height = 0;
  canvas2.style.opacity = 0;
  canvas2.style.backgroundColor = "";
  canvas2.style.visibility = 'hidden';
  canvas2.removeEventListener("mousedown", start_rect);
  canvas2.removeEventListener("mousemove", draw_rect);
  canvas2.removeEventListener("mouseup", stop_rect);
  rect_check = false;
}

async function start_rect(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x = currentPoint.x; //used to store the initial point
  controlPoint.y = currentPoint.y;
  stroke_properties(ctx2);
  stroke = true;
}

async function draw_rect(event) {
  if (!stroke) { return; }
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx2.beginPath();
  ctx2.moveTo(controlPoint.x, controlPoint.y);
  locator(event);
  ctx2.lineTo(currentPoint.x, controlPoint.y);
  ctx2.lineTo(currentPoint.x, currentPoint.y);
  ctx2.lineTo(controlPoint.x, currentPoint.y);
  ctx2.lineTo(controlPoint.x, controlPoint.y);
  ctx2.moveTo(currentPoint.x, currentPoint.y);
  ctx2.stroke();
  ctx2.closePath();
  socket.emit('drawRect', { currentPoint, controlPoint });
}

async function stop_rect() {
  stroke = false;
  stroke_properties(ctx1);
  ctx1.beginPath();
  ctx1.moveTo(controlPoint.x, controlPoint.y);
  ctx1.lineTo(currentPoint.x, controlPoint.y);
  ctx1.lineTo(currentPoint.x, currentPoint.y);
  ctx1.lineTo(controlPoint.x, currentPoint.y);
  ctx1.lineTo(controlPoint.x, controlPoint.y);
  ctx1.moveTo(currentPoint.x, currentPoint.y);
  ctx1.stroke();
  ctx1.closePath();
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  update_page_image();
  if (drawer_check == 1) {
    socket.emit('stopRect', { currentPoint, controlPoint });
  }
  drawer_check = 1;
}

const draw_rect_helper = (data) => {
  if (!stroke) { return; }
  currentPoint = data.currentPoint;
  controlPoint = data.controlPoint;
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx2.beginPath();
  ctx2.moveTo(controlPoint.x, controlPoint.y);
  ctx2.lineTo(currentPoint.x, controlPoint.y);
  ctx2.lineTo(currentPoint.x, currentPoint.y);
  ctx2.lineTo(controlPoint.x, currentPoint.y);
  ctx2.lineTo(controlPoint.x, controlPoint.y);
  ctx2.moveTo(currentPoint.x, currentPoint.y);
  ctx2.stroke();
  ctx2.closePath();
}

//circle shape drawing 
var circle_check = false;
async function start_circle_drawing() {

  if (circle_check) {
    check_tools();
    return;
  }

  check_tools();
  document.getElementById("pagecontainer").style.cursor = 'crosshair';
  canvas2.addEventListener("mousedown", start_circle);
  canvas2.addEventListener("mousemove", draw_circle);
  canvas2.addEventListener("mouseup", stop_circle);
  canvas2.width = window.innerWidth * (0.45);
  canvas2.height = window.innerHeight * (0.80);
  canvas2.style.opacity = 1;
  canvas2.style.visibility = 'visible';
  circle_check = true;
}


async function stop_circle_drawing() {
  canvas2.width = 0;
  canvas2.height = 0;
  canvas2.style.opacity = 0;
  canvas2.style.backgroundColor = "";
  canvas2.style.visibility = 'hidden';
  canvas2.removeEventListener("mousedown", start_circle);
  canvas2.removeEventListener("mousemove", draw_circle);
  canvas2.removeEventListener("mouseup", stop_circle);
  circle_check = false;
}

async function start_circle(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x = currentPoint.x;
  controlPoint.y = currentPoint.y;
  stroke_properties(ctx2);
  stroke = true;
}

async function draw_circle(data) {
  if (!stroke) { return; }
  if (drawer_check == 0) {
    currentPoint = data.currentPoint;
    controlPoint = data.controlPoint;
  }
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx2.beginPath();
  if (drawer_check == 1) {
    locator(data);
  }
  var radius;
  if ((currentPoint.x - controlPoint.x) < 0) {
    radius = controlPoint.x - currentPoint.x;
  } else {
    radius = currentPoint.x - controlPoint.x;
  }
  ctx2.arc(controlPoint.x, controlPoint.y, radius, 0 * Math.PI, 2 * Math.PI);
  ctx2.stroke();
  if (drawer_check == 1) {
    socket.emit('drawCircle', { currentPoint, controlPoint });
  }
  drawer_check = 1;
}

async function stop_circle() {
  stroke = false;
  stroke_properties(ctx1);
  var radius;
  if ((currentPoint.x - controlPoint.x) < 0) {
    radius = controlPoint.x - currentPoint.x;
  } else {
    radius = currentPoint.x - controlPoint.x;
  }
  ctx1.beginPath();
  ctx1.arc(controlPoint.x, controlPoint.y, radius, 0 * Math.PI, 2 * Math.PI);
  ctx1.stroke();
  ctx1.closePath();
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  update_page_image();
  if (drawer_check == 1) {
    socket.emit('stopCircle', { currentPoint, controlPoint });
  }
  drawer_check = 1;
}


//line drawing functionality

var line_check = false;
async function line() {
  if (line_check) {
    check_tools();
    return;
  }
  check_tools();
  document.getElementById("pagecontainer").style.cursor = 'crosshair';
  canvas2.addEventListener("mousedown", start_line);
  canvas2.addEventListener("mousemove", draw_line);
  canvas2.addEventListener("mouseup", stop_line);
  canvas2.width = window.innerWidth * (0.45);
  canvas2.height = window.innerHeight * (0.80);
  canvas2.style.opacity = 1;
  canvas2.style.visibility = 'visible';
  line_check = true;
}

async function stop_line_drawing() {
  canvas2.width = 0;
  canvas2.height = 0;
  canvas2.style.opacity = 0;
  canvas2.style.backgroundColor = "";
  canvas2.style.visibility = 'hidden';
  canvas2.removeEventListener("mousedown", start_line);
  canvas2.removeEventListener("mousemove", draw_line);
  canvas2.removeEventListener("mouseup", stop_line);
  line_check = false;
}

async function start_line(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x = currentPoint.x;
  controlPoint.y = currentPoint.y;
  stroke_properties(ctx2);
  stroke = true;
}

async function draw_line(data) {
  if (!stroke) { return; }
  if (drawer_check == 0) {
    currentPoint = data.currentPoint;
    controlPoint = data.controlPoint;
  }
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx2.beginPath();
  ctx2.moveTo(controlPoint.x, controlPoint.y);
  if (drawer_check == 1) {
    locator(data);
  }
  ctx2.lineTo(currentPoint.x, currentPoint.y);
  ctx2.stroke();
  ctx2.closePath();
  if (drawer_check == 1) {
    socket.emit('drawLine', { currentPoint, controlPoint });
  }
  drawer_check = 1;
}

async function stop_line() {
  stroke = false;
  stroke_properties(ctx1);
  ctx1.beginPath();
  ctx1.moveTo(controlPoint.x, controlPoint.y);
  ctx1.lineTo(currentPoint.x, currentPoint.y);
  ctx1.stroke();
  ctx1.closePath();
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  update_page_image();
  if (drawer_check == 1) {
    socket.emit('stopLine', { currentPoint, controlPoint });
  }
  drawer_check = 1;
}

//stopping all the tools using thier stop function
const check_tools = () => {
  if (rect_check) {
    stop_rect_drawing();
  }
  if (circle_check) {
    stop_circle_drawing();
  }
  if (line_check) {
    stop_line_drawing();
  }
  if (eraser_check) {
    stop_eraser();
  }
}


//eraser functionality 

//eraser state stored
var eraser_check = false;
//to store initial free drawing stroke properties
var lstrokecolor;
var lstrokewidth;
function start_eraser() {
  if (eraser_check) {
    stop_eraser();
    return;
  }
  lstrokewidth = document.getElementById("strokewidth").value;
  lstrokecolor = document.getElementById('strokecolor').value;
  document.getElementById("strokecolor").disabled = true;
  document.getElementById("pagecontainer").style.cursor = "url('board icons/Eraser_cursor.png'),auto";
  check_tools();
  eraser_check = true;
  document.getElementById("strokewidth").value = 30;
  document.getElementById('strokecolor').value = "#ffffff";
  document.getElementById('eraser').style.backgroundColor = "#9392FF";

  if (drawer_check == 1) {
    socket.emit('erase', { lstrokecolor, lstrokewidth });
  }
  drawer_check = 1;
}

function stop_eraser() {
  document.getElementById('eraser').style.backgroundColor = "white";
  eraser_check = false;
  document.getElementById("strokewidth").value = lstrokewidth;
  document.getElementById("strokecolor").disabled = false;
  document.getElementById('strokecolor').value = lstrokecolor;
  if (drawer_check == 1) {
    socket.emit('stopEraser');
  }
  drawer_check = 1;
}





var imageArray_index;

//updating the page and storing in undo array
async function update_page_image() {
  var board_image = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  //console.log("first");
  //console.log(imageArray_index);
  if (imageArray_index < (imageArray.length)) {
    imageArray.splice((imageArray_index + 1), (imageArray.length - imageArray_index - 1));
  }
  imageArray.push(board_image);
  imageArray_index = imageArray.length - 1;
  // console.log("first");
  // console.log(imageArray_index);
  buttonState();
}

//undo function 
async function undo() {
  // console.log("undo");
  // console.log(imageArray_index);
  if (imageArray_index > 0) {
    imageArray_index -= 1;
    ctx1.putImageData(imageArray[imageArray_index], 0, 0);
    //console.log(imageArray[imageArray_index]);
    if (undo_check === 1) {
      socket.emit('undodo');
    }
  }
  undo_check = 1;
  buttonState();

}

//redo function
async function redo() {
  if (imageArray_index < imageArray.length) {
    imageArray_index++;
    ctx1.putImageData(imageArray[imageArray_index], 0, 0);
    if (redo_check == 1) {
      socket.emit("redoDo");
    }
  }
  redo_check = 1;
  buttonState();
}

//to check the state of undo and redo button
async function buttonState() {
  //enabling and disabling of buttons
  if (imageArray_index == 0) {
    document.getElementById('undo').disabled = true;
  }
  if (imageArray_index == (imageArray.length - 1)) {
    document.getElementById('redo').disabled = true;
  }
  if (imageArray_index > 0) {
    document.getElementById('undo').disabled = false;
  }
  if (imageArray_index < (imageArray.length - 1)) {
    document.getElementById('redo').disabled = false;
  }
  //number of undo's that can be done
  if (imageArray.length > 25) {
    imageArray.splice(0, (imageArray.length - 25));
  }
}



//bucket fill functionality

var bucket_check = false;
var rc;

//function to convert hexadecimal color code to rgb form
function hexToRgb(hexCode) {

  // Remove the '#' character if it exists
  hexCode = hexCode.replace(/^#/, '');

  // Parse the hex code to RGB
  let bigint = parseInt(hexCode, 16);
  let red = (bigint >> 16) & 255;
  let green = (bigint >> 8) & 255;
  let blue = bigint & 255;

  return [red, green, blue, 255];
}


function bucket_fun() {
  if (bucket_check == true) {
    enableDrawing();
    bucket_check = false;
    return;
  }
  check_tools();
  disable_setup();
  start_bucket_fill();
  bucket_check = true;
}

function start_bucket_fill() {
  canvas1.addEventListener('click', bucket);
}

function bucket(event) {
  locator(event);
  rc = hexToRgb(document.getElementById('strokecolor').value.toString());
  floodFill(currentPoint.x, currentPoint.y, rc);
  socket.emit('bucketFill', { currentPoint, rc });
}

//
function floodFill(x, y, fillColor) {
  //console.log("innnnn");
  var targetColor = getPixel(currentPoint.x, currentPoint.y, ctx1.getImageData(0, 0, canvas1.width, canvas1.height));
  // check we are actually filling a different color
  //console.log("target color: ", targetColor);
  if (!colorsMatch(targetColor, fillColor)) {
    fillPixel(x, y, targetColor, fillColor, ctx1.getImageData(0, 0, canvas1.width, canvas1.height));
    fillNeighbour(ctx1.getImageData(0, 0, canvas1.width, canvas1.height));
  }
}


//function to set pixel color
function setPixel(x, y, color, imageData) {
  const offset = (y * imageData.width + x) * 4;
  imageData.data[offset + 0] = color[0];
  imageData.data[offset + 1] = color[1];
  imageData.data[offset + 2] = color[2];
  imageData.data[offset + 3] = color[3];
}

//to check if two colors have same rgb array
function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

var nextPixel = [];
function fillPixel(x, y, targetColor, fillColor, imageData) {
  const currentColor = getPixel(x, y, imageData);
  if (colorsMatch(currentColor, targetColor)) {
    setPixel(x, y, fillColor, imageData);
    nextPixel.push([x + 1, y, targetColor, fillColor]);
    nextPixel.push([x - 1, y, targetColor, fillColor]);
    nextPixel.push([x, y + 1, targetColor, fillColor]);
    nextPixel.push([x, y - 1, targetColor, fillColor]);
  }
}

function fillNeighbour(imageData) {
  if (nextPixel.length) {
    let size = nextPixel.length;

    for (let i = 0; i < size; i++) {
      fillPixel(
        nextPixel[i][0],
        nextPixel[i][1],
        nextPixel[i][2],
        nextPixel[i][3],
        imageData
      );
    }

    nextPixel.splice(0, size);

    fillNeighbour(imageData);
  } else {
    ctx1.putImageData(imageData, 0, 0);
    update_page_image();
    nextPixel = [];
  }
}



function getPixel(x, y, imageData) {
  if (
    x < 0 ||
    y < 0 ||
    x >= imageData.width ||
    y >= imageData.height
  ) {
    return [-1, -1, -1, -1]; // impossible color
  } else {
    const offset = (y * imageData.width + x) * 4;

    return [
      imageData.data[offset + 0],
      imageData.data[offset + 1],
      imageData.data[offset + 2],
      imageData.data[offset + 3],
    ];
  }
}


//function to download the image 
function download_img() {
  var link = document.createElement('a');
  link.download = 'filename.png';
  link.href = document.getElementById('canvas1').toDataURL();

  link.click();

  socket.emit('shareSocials');

}



//sockets recieved from the backend listened here

socket.on('drawing', async (data) => {
  //console.log(data);
  stroke = true;
  document.getElementById('strokewidth').value = data.strokeWidth;
  document.getElementById('strokecolor').value = data.strokeColor;
  stroke_properties(ctx1);
  await draw1(data);
})

socket.on('stopdrawing', async () => {
  //console.log("yes");
  stroke = false;
  await update_page_image();
})


socket.on('drawRect', (data) => {

  stroke = true;
  draw_rect_helper(data);

})

socket.on('stopRect', (data) => {
  check_tools();
  drawer_check = 0;
  currentPoint = data.currentPoint;
  controlPoint = data.controlPoint;
  stop_rect();
})

socket.on('drawCircle', (data) => {
  stroke = true;
  drawer_check = 0;
  draw_circle(data);
})

socket.on('stopCircle', (data) => {
  check_tools();
  drawer_check = 0;
  currentPoint = data.currentPoint;
  controlPoint = data.controlPoint;
  stop_circle();
})

socket.on('drawLine', (data) => {
  stroke = true;
  drawer_check = 0;
  draw_line(data);
})

socket.on('stopLine', (data) => {
  check_tools();
  drawer_check = 0;
  currentPoint = data.currentPoint;
  controlPoint = data.controlPoint;
  stop_line();
})

socket.on("eraser", (data) => {
  drawer_check = 0;
  lstrokecolor = data.lstrokecolor;
  lstrokewidth = data.lstrokewidth;
  start_eraser();
})

socket.on('stopEraser', () => {
  drawer_check = 0;
  stop_eraser();
})

socket.on('bucketFill', (data) => {
  //console.log("bucketFill");
  currentPoint = data.currentPoint;
  floodFill(data.currentPoint.x, data.currentPoint.y, data.rc);
})

socket.on('undodo', async () => {
  undo_check = 0;
  await undo();
})

socket.on("redoDo", async () => {
  //console.log("redo");
  redo_check = 0;
  await redo();
})

socket.on('disableCanvas', async () => {
  toolbox.style.visibility = 'hidden';
  for (var opac = 1; opac >= 0; opac -= 0.1) {
    toolbox.style.opacity = opac;
  }
  resize();
  check_tools();
  disable_setup();
  stop_rect_drawing();
})

socket.on('enableCanvas', async () => {
  resize();
  toolbox.style.visibility = 'visible';
  check_tools();
  for (var opac = 0; opac <= 1; opac += 0.1) {
    toolbox.style.opacity = opac;
  }
  enableDrawing();

})

socket.on('clearCanvas', () => {
  clear_check = 0;
  clear_page(ctx1);
});


