//Defined constants
var undo_check = 1;
var redo_check = 1;
var drawer_check = 1;
const canv = document.getElementById('canvas1');
const cntx = canv.getContext('2d');
const canv3 = document.getElementById('canvas3');
const cntx3 = canv3.getContext('2d');
const toolbox = document.getElementById('toolbox');
const sideout = document.getElementById('sidepanelout');
var undo_arr = [];





document.onload = initi();



//So that no items or text of the toolbox can be selected.
var x = document.getElementById("toolbox");
x.style.WebkitUserSelect = "none"; // Safari
x.style.msUserSelect = "none"; // IE 10 and IE11
x.style.userSelect = "none"; // Standard syntax

function initi() {
  resize();
  //Setting up for normal drawing
  drawing_setup();
  //window.addEventListener("resize", resize_info);
  document.getElementById("boardcolor").addEventListener("input", board_color, { passive: true });
  document.getElementById("strokecolor").addEventListener("input", stroke_properties, { passive: true });
  document.getElementById("strokewidth").addEventListener("input", stroke_properties, { passive: true });
  document.getElementById("pagecontainer").style.cursor = "url('board icons/Pen_cursor.png'),auto";
  setup();
}

var full_screen = false;
function resize() {
  //saving original image
  var original = cntx.getImageData(0, 0, canv.width, canv.height);
  //resizing the canvas
  canv.width = window.innerWidth * (0.45);
  canv.height = window.innerHeight * (0.80);
  //filling the canvas with a background color
  board_color();
  //placing the image back on to this canvas
  cntx.putImageData(original, 0, 0, 0, 0, canv.width, canv.height);
  if (full_screen) { document.body.requestFullscreen(); }
}

function resize_info() {
  if (confirm("Resizing can lead to loss of data and quality of your image.Do you want to resize?")) {
    resize();
  }
}

function drawing_setup() {
  canv.addEventListener("touchstart", start_draw);
  canv.addEventListener("touchmove", draw);
  canv.addEventListener("touchend", stop_draw);
  canv.addEventListener("mousedown", start_draw);
  canv.addEventListener("mousemove", draw);
  canv.addEventListener("mouseup", stop_draw);
  canv.addEventListener("mouseup", auxillary_stop_draw);
  canv.addEventListener("mouseout", stop_draw);
  canv.addEventListener("pointerdown", start_draw);
  canv.addEventListener("pointermove", draw);
  canv.addEventListener("pointerup", stop_draw);
  canv.addEventListener("pointerup", auxillary_stop_draw);
  canv.addEventListener("pointerout", stop_draw);
}

function disable_setup() {
  canv.removeEventListener("touchstart", start_draw);
  canv.removeEventListener("touchmove", draw);
  canv.removeEventListener("touchend", stop_draw);
  canv.removeEventListener("mousedown", start_draw);
  canv.removeEventListener("mousemove", draw);
  canv.removeEventListener("mouseup", stop_draw);
  canv.removeEventListener("mouseup", auxillary_stop_draw);
  canv.removeEventListener("mouseout", stop_draw);
  canv.removeEventListener("pointerdown", start_draw);
  canv.removeEventListener("pointermove", draw);
  canv.removeEventListener("pointerup", stop_draw);
  canv.removeEventListener("pointerup", auxillary_stop_draw);
  canv.removeEventListener("pointerout", stop_draw);
}

function setup() {
  toolbox.style.height = (window.innerHeight - 44) + 'px';

  board_color();
  toggle_sidepanel();
  //start_pencil();
  toggle_sidepanel();
  update_page_image();

}

async function toggle_sidepanel() {
  if (toolbox.style.visibility == 'hidden') {
    toolbox.style.visibility = 'visible';
    for (var opac = 0; opac <= 1; opac += 0.1) {
      toolbox.style.opacity = opac;
    }
  }
  else {
    toolbox.style.visibility = 'hidden';
    for (var opac = 1; opac >= 0; opac -= 0.1) {
      toolbox.style.opacity = opac;
    }
  }
}


async function board_color() {
  //changing background color of canvas
  canv.style.backgroundColor = document.getElementById("boardcolor").value;

  //sleep(1000);
  //filling the canvas with a color
  cntx.fillStyle = document.getElementById("boardcolor").value;
  cntx.fillRect(0, 0, canv.width, canv.height);

}

var full_screen = false;



//drawing pre-requisites
var loc = { x: 0, y: 0 };
var controlPoint = { x: 0, y: 0 };   //for quadratic curve

async function locator(event) {
  if (event.touches) {
    loc.x = event.touches[0].clientX - canv.offsetLeft;
    loc.y = event.touches[0].clientY - canv.offsetTop;
  }
  else {
    loc.x = event.clientX - canv.offsetLeft;
    loc.y = event.clientY - canv.offsetTop;
  }
}

//drawing functions
var strok = false;

var sw, strokColor;
async function stroke_properties(cntx_name) {
  cntx_name.lineCap = 'round';
  sw = document.getElementById('strokewidth').value;
  cntx_name.lineWidth = sw;
  strokColor = document.getElementById('strokecolor').value;
  cntx_name.strokeStyle = strokColor;
  cntx_name.lineJoin = 'round';
}

async function start_draw(event) {
  event.preventDefault();
  locator(event);
  stroke_properties(cntx);
  strok = true;
}

async function auxillary_stop_draw() {
  strok = false;
  update_page_image();
  socket.emit('stopdrawing');
}

async function stop_draw(event) {
  strok = false;
}

var loc_prev;
async function draw(event) {
  if (!strok) { return; }
  cntx.beginPath();
  loc_prev = loc;

  cntx.moveTo(loc.x, loc.y);
  console.log(loc);
  //locator(event);
  controlPoint.x = loc.x;
  controlPoint.y = loc.y;
  //new piece
  locator(event);
  controlPoint.x = (controlPoint.x + loc.x) / 2;
  controlPoint.y = (controlPoint.y + loc.y) / 2;

  locator(event);

  cntx.quadraticCurveTo(controlPoint.x, controlPoint.y, loc.x, loc.y);
  console.log(controlPoint);
  console.log(loc);
  cntx.stroke();
  cntx.closePath();

  socket.emit('drawing', { loc_prev, loc,controlPoint, sw, strokColor });
}

var clear_check = 1;
function clear_page(cntx_name) {
  undo_arr = [];
  undo_arr_index = 0;
  button_state_checker();
  cntx_name.clearRect(0, 0, canv.width, canv.height);
  cntx_name.fillStyle = document.getElementById("boardcolor").value;
  cntx_name.fillRect(0, 0, canv.width, canv.height);
  update_page_image()
  if (clear_check == 1) {
    socket.emit("clearCanvas");
  }
  clear_check = 1;
}


async function draw1(data) {
  console.log(data);
  loc = data.loc;
  controlPoint = data.controlPoint;
  if (!strok) { return; }
  cntx.beginPath();
  cntx.moveTo(data.loc_prev.x, data.loc_prev.y);
  //console.log("yes");
  cntx.quadraticCurveTo(controlPoint.x, controlPoint.y, loc.x, loc.y);
  cntx.stroke();
  cntx.closePath();

}

//rectangle drawing 
var isRectOn = false;
async function start_rect_drawing() {
    if(isRectOn){
      check_tools();
      return;
    }
    check_tools();
    document.getElementById("pagecontainer").style.cursor = 'crosshair';
    canv3.addEventListener("touchstart", start_rect);
    canv3.addEventListener("touchmove", draw_rect);
    canv3.addEventListener("touchend", stop_rect);
    canv3.addEventListener("mousedown", start_rect);
    canv3.addEventListener("mousemove", draw_rect);
    canv3.addEventListener("mouseup", stop_rect);
    canv3.addEventListener("pointerdown", start_rect);
    canv3.addEventListener("pointermove", draw_rect);
    canv3.addEventListener("pointerup", stop_rect);
    canv3.width = window.innerWidth * (0.45);
    canv3.height = window.innerHeight * (0.80);
    canv3.style.opacity = 1;
    canv3.style.visibility = 'visible';
    document.getElementById('strokecolor').value = pstrokecolor;
    document.getElementById('strokewidth').value = pstrokewidth;
    isRectOn = true;
  
}

async function stop_rect_drawing() {
  canv3.width = 0;
  canv3.height = 0;
  canv3.style.opacity = 0;
  canv3.style.backgroundColor = "";
  canv3.style.visibility = 'hidden';
  canv3.removeEventListener("touchstart", start_rect);
  canv3.removeEventListener("touchmove", draw_rect);
  canv3.removeEventListener("touchend", stop_rect);
  canv3.removeEventListener("mousedown", start_rect);
  canv3.removeEventListener("mousemove", draw_rect);
  canv3.removeEventListener("mouseup", stop_rect);
  canv3.removeEventListener("pointerdown", start_rect);
  canv3.removeEventListener("pointermove", draw_rect);
  canv3.removeEventListener("pointerup", stop_rect);
  pstrokewidth = document.getElementById('strokewidth').value;
  pstrokecolor = document.getElementById('strokecolor').value;
  isRectOn = false;
}

async function start_rect(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x = loc.x; //used to store the initial point
  controlPoint.y = loc.y;
  stroke_properties(cntx3);
  strok = true;
}

async function draw_rect(event) {
  if (!strok) { return; }
  cntx3.clearRect(0, 0, canv3.width, canv3.height);
  cntx3.beginPath();
  cntx3.moveTo(controlPoint.x, controlPoint.y);
  locator(event);
  cntx3.lineTo(loc.x, controlPoint.y);
  cntx3.lineTo(loc.x, loc.y);
  cntx3.lineTo(controlPoint.x, loc.y);
  cntx3.lineTo(controlPoint.x, controlPoint.y);
  cntx3.moveTo(loc.x, loc.y);
  cntx3.stroke();
  cntx3.closePath();
  socket.emit('drawRect', { loc, controlPoint });
}

async function stop_rect() {
  strok = false;  //turn off drawing, and immediately draw the current line to canvas1
  stroke_properties(cntx);
  cntx.beginPath();
  cntx.moveTo(controlPoint.x, controlPoint.y);
  cntx.lineTo(loc.x, controlPoint.y);
  cntx.lineTo(loc.x, loc.y);
  cntx.lineTo(controlPoint.x, loc.y);
  cntx.lineTo(controlPoint.x, controlPoint.y);
  cntx.moveTo(loc.x, loc.y);
  cntx.stroke();
  cntx.closePath();
  cntx3.clearRect(0, 0, canv3.width, canv3.height);
  update_page_image();
  if (drawer_check == 1) {
    socket.emit('stopRect', { loc, controlPoint });
  }
  drawer_check = 1;
}
const draw_rect_helper = (data) => {
  if (!strok) { return; }
  loc = data.loc;
  controlPoint = data.controlPoint;
  cntx3.clearRect(0, 0, canv3.width, canv3.height);
  cntx3.beginPath();
  cntx3.moveTo(controlPoint.x, controlPoint.y);
  cntx3.lineTo(loc.x, controlPoint.y);
  cntx3.lineTo(loc.x, loc.y);
  cntx3.lineTo(controlPoint.x, loc.y);
  cntx3.lineTo(controlPoint.x, controlPoint.y);
  cntx3.moveTo(loc.x, loc.y);
  cntx3.stroke();
  cntx3.closePath();
}

var isCircleOn=false;
//Trying circle drawing
async function start_circle_drawing() {

  if(isCircleOn){
    check_tools();
    return;
  }

  check_tools();
  document.getElementById("pagecontainer").style.cursor= 'crosshair';
  canv3.addEventListener("touchstart", start_circle);
  canv3.addEventListener("touchmove", draw_circle);
  canv3.addEventListener("touchend", stop_circle);
  canv3.addEventListener("mousedown", start_circle);
  canv3.addEventListener("mousemove", draw_circle);
  canv3.addEventListener("mouseup", stop_circle);
  canv3.addEventListener("pointerdown", start_circle);
  canv3.addEventListener("pointermove", draw_circle);
  canv3.addEventListener("pointerup", stop_circle);
  canv3.width = window.innerWidth*(0.45);
  canv3.height = window.innerHeight*(0.80);
  canv3.style.opacity=1;
  canv3.style.visibility='visible';
  document.getElementById('strokecolor').value = pstrokecolor;
  document.getElementById('strokewidth').value = pstrokewidth;
  isCircleOn=true;
  
}

async function stop_circle_drawing() {
  canv3.width = 0;
  canv3.height = 0;
  canv3.style.opacity=0;
  canv3.style.backgroundColor="";
  canv3.style.visibility='hidden';
  canv3.removeEventListener("touchstart", start_circle);
  canv3.removeEventListener("touchmove", draw_circle);
  canv3.removeEventListener("touchend", stop_circle);
  canv3.removeEventListener("mousedown", start_circle);
  canv3.removeEventListener("mousemove", draw_circle);
  canv3.removeEventListener("mouseup", stop_circle);
  canv3.removeEventListener("pointerdown", start_circle);
  canv3.removeEventListener("pointermove", draw_circle);
  canv3.removeEventListener("pointerup", stop_circle);
  pstrokewidth = document.getElementById('strokewidth').value;
  pstrokecolor = document.getElementById('strokecolor').value;
  isCircleOn=false;
}

async function start_circle(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x=loc.x; //used to store the initial point
  controlPoint.y=loc.y;
  stroke_properties(cntx3);
  strok =true;
}

async function draw_circle(data) {
  if (!strok){return;}
  if(drawer_check==0){
    loc=data.loc;
    controlPoint=data.controlPoint;
  }
  cntx3.clearRect(0,0,canv3.width,canv3.height);
  cntx3.beginPath();
 // cntx3.moveTo(controlPoint.x,controlPoint.y);
  if(drawer_check==1){
    locator(data);
  }
  //document.getElementById('toolscontainer').innerHTML = "X:" + loc.x +"   Y:" + loc.y ; //for testing
	var radius;
	if((loc.x-controlPoint.x)<0){
		radius = controlPoint.x - loc.x;
	}else{
		radius = loc.x-controlPoint.x;
	}
  cntx3.arc(controlPoint.x,controlPoint.y,radius,0*Math.PI,2*Math.PI);
  cntx3.stroke();
  if(drawer_check==1){
  socket.emit('drawCircle', { loc, controlPoint });
  }
  drawer_check=1;
}

async function stop_circle() {
  strok = false;  //turn off drawing, and immediately draw the current line to canvas1
  stroke_properties(cntx);
	var radius;
	if((loc.x-controlPoint.x)<0){
		radius = controlPoint.x - loc.x;
	}else{
		radius = loc.x-controlPoint.x;
	}
  cntx.beginPath();
	cntx.arc(controlPoint.x,controlPoint.y,radius,0*Math.PI,2*Math.PI);
  cntx.stroke();
  cntx.closePath();
  cntx3.clearRect(0,0,canv3.width,canv3.height);
  update_page_image();
  if(drawer_check==1){
  socket.emit('stopCircle', { loc, controlPoint });
  }
  drawer_check=1;
}

var isLineOn=false;
async function line() {
  if(isLineOn){
    check_tools();
    return;
  }
  check_tools();
  document.getElementById("pagecontainer").style.cursor= 'crosshair';
  canv3.addEventListener("touchstart", start_line);
  canv3.addEventListener("touchmove", draw_line);
  canv3.addEventListener("touchend", stop_line);
  canv3.addEventListener("mousedown", start_line);
  canv3.addEventListener("mousemove", draw_line);
  canv3.addEventListener("mouseup", stop_line);
  canv3.addEventListener("pointerdown", start_line);
  canv3.addEventListener("pointermove", draw_line);
  canv3.addEventListener("pointerup", stop_line);
  canv3.width = window.innerWidth*(0.45);
  canv3.height = window.innerHeight*(0.80);
  canv3.style.opacity=1;
  canv3.style.visibility='visible';
  document.getElementById('strokecolor').value = pstrokecolor;
  document.getElementById('strokewidth').value = pstrokewidth;
  isLineOn=true;
}

async function stop_line_drawing() {
  canv3.width = 0;
  canv3.height = 0;
  canv3.style.opacity=0;
  canv3.style.backgroundColor="";
  canv3.style.visibility='hidden';
  canv3.removeEventListener("touchstart", start_line);
  canv3.removeEventListener("touchmove", draw_line);
  canv3.removeEventListener("touchend", stop_line);
  canv3.removeEventListener("mousedown", start_line);
  canv3.removeEventListener("mousemove", draw_line);
  canv3.removeEventListener("mouseup", stop_line);
  canv3.removeEventListener("pointerdown", start_line);
  canv3.removeEventListener("pointermove", draw_line);
  canv3.removeEventListener("pointerup", stop_line);
  pstrokewidth = document.getElementById('strokewidth').value;
  pstrokecolor = document.getElementById('strokecolor').value;
  isLineOn=false;
}

async function start_line(event) {
  event.preventDefault();
  locator(event);
  controlPoint.x=loc.x; //used to store the initial point
  controlPoint.y=loc.y;
  stroke_properties(cntx3);
  strok =true;
}

async function draw_line(data) {
  if (!strok){return;}
  if(drawer_check==0){
    loc=data.loc;
    controlPoint=data.controlPoint;
  }
  cntx3.clearRect(0,0,canv3.width,canv3.height);
  cntx3.beginPath();
  cntx3.moveTo(controlPoint.x,controlPoint.y);
  if(drawer_check==1){
    locator(data);
  }
  cntx3.lineTo(loc.x, loc.y);
  cntx3.stroke();
  cntx3.closePath();
  if(drawer_check==1){
    socket.emit('drawLine',{loc,controlPoint});
  }
  drawer_check=1;
}

async function stop_line() {
  strok = false;  //turn off drawing, and immediately draw the current line to canvas1
  stroke_properties(cntx);
  cntx.beginPath();
  cntx.moveTo(controlPoint.x,controlPoint.y);
  cntx.lineTo(loc.x, loc.y);
  cntx.stroke();
  cntx.closePath();
  cntx3.clearRect(0,0,canv3.width,canv3.height);
  update_page_image();
  if(drawer_check==1){
    socket.emit('stopLine',{loc,controlPoint});
  }
  drawer_check=1;
}
//line drawing complete
const check_tools=()=>{
  if(isRectOn){
    stop_rect_drawing();
  }
  if(isCircleOn){
    stop_circle_drawing();
  }
  if(isLineOn){
    stop_line_drawing();
  }
  if(isEraserOn){
    stop_eraser();
  }
}

var isEraserOn=false;
var lstrokecolor;
var lstrokewidth;
function start_eraser() {
  if(isEraserOn){
    stop_eraser();
    return;
  }
  lstrokewidth = document.getElementById("strokewidth").value;
  lstrokecolor = document.getElementById('strokecolor').value;
  document.getElementById("strokecolor").disabled = true;
  document.getElementById("pagecontainer").style.cursor= "url('board icons/Eraser_cursor.png'),auto";
  check_tools();
  isEraserOn=true;
  document.getElementById("strokewidth").value =30;
  document.getElementById('strokecolor').value ="#ffffff";
  document.getElementById('eraser').style.backgroundColor = "#9392FF";

  if(drawer_check==1){
    socket.emit('erase',{lstrokecolor,lstrokewidth});
  }
  drawer_check=1;
}

function stop_eraser() {
  document.getElementById('eraser').style.backgroundColor = "white";
  isEraserOn=false;
  document.getElementById("strokewidth").value =lstrokewidth;
  document.getElementById("strokecolor").disabled = false;
  document.getElementById('strokecolor').value =lstrokecolor;
  if(drawer_check==1){
    socket.emit('stopEraser');
  }
  drawer_check=1;
}




//Undo Redo functionality:
var undo_arr_index;
async function update_page_image() {
  var board_image = cntx.getImageData(0, 0, canv.width, canv.height);
  console.log("first");
  console.log(undo_arr_index);
  if (undo_arr_index < (undo_arr.length)) {
    undo_arr.splice((undo_arr_index + 1), (undo_arr.length - undo_arr_index - 1));
  }
  undo_arr.push(board_image);
  undo_arr_index = undo_arr.length - 1; //array indexing issue
  console.log("first");
  console.log(undo_arr_index);
  button_state_checker();
  //console.log(undo_arr.length)//for testing
}

async function undo() {
  console.log("undo");
  console.log(undo_arr_index);
  if (undo_arr_index > 0) {
    undo_arr_index -= 1;
    cntx.putImageData(undo_arr[undo_arr_index], 0, 0);
    console.log(undo_arr[undo_arr_index]);
    if (undo_check === 1) {
      socket.emit('undodo');
    }
  }
  undo_check = 1;
  button_state_checker();

}

async function redo() {
  if (undo_arr_index < undo_arr.length) {
    undo_arr_index++;
    cntx.putImageData(undo_arr[undo_arr_index], 0, 0);
    if (redo_check == 1) {
      socket.emit("redoDo");
    }
  }
  redo_check = 1;
  button_state_checker();
}

async function button_state_checker() {
  //enabling and disabling of buttons
  if (undo_arr_index == 0) {
    document.getElementById('action8').disabled = true;
  }
  if (undo_arr_index == (undo_arr.length - 1)) {
    document.getElementById('action9').disabled = true;
  }
  if (undo_arr_index > 0) {
    document.getElementById('action8').disabled = false;
  }
  if (undo_arr_index < (undo_arr.length - 1)) {
    document.getElementById('action9').disabled = false;
  }
  //number of undo's that can be done
  if (undo_arr.length > 25) {
    undo_arr.splice(0, (undo_arr.length - 25));
  }
}



//var bucket_fill
var bucket_check=false;
var rc;
function hexToRgb(hexCode) {
  // Remove the '#' character if it exists
  
  hexCode = hexCode.replace(/^#/, '');

  // Parse the hex code to RGB
  let bigint = parseInt(hexCode, 16);
  let red = (bigint >> 16) & 255;
  let green = (bigint >> 8) & 255;
  let blue = bigint & 255;

  return [red, green, blue,255];
}

function bucket_fun(){
  if(bucket_check==true){
    drawing_setup();
    bucket_check=false;
    return;
  }
  check_tools();
  disable_setup();
  start_bucket_fill();
  bucket_check=true;
}
function start_bucket_fill(){
  canv.addEventListener('click',bucket);
}

function bucket(event){
  locator(event);
  rc=hexToRgb(document.getElementById('strokecolor').value.toString());
  floodFill(loc.x,loc.y,rc);
  socket.emit('bucketFill',{loc,rc});
}

function floodFill(x, y, fillColor) {
  console.log("innnnn");
  var targetColor = getPixel(loc.x, loc.y, cntx.getImageData(0, 0, canv.width, canv.height));
  // check we are actually filling a different color
  console.log("target color: ", targetColor);
  if (!colorsMatch(targetColor, fillColor)) {
     fillPixel(x, y, targetColor, fillColor,cntx.getImageData(0, 0, canv.width, canv.height));
     fillCol(cntx.getImageData(0, 0, canv.width, canv.height));
  }
}

function setPixel(x, y, color, imageData) {
  const offset = (y *  imageData.width + x) * 4;
   imageData.data[offset + 0] = color[0];
   imageData.data[offset + 1] = color[1];
   imageData.data[offset + 2] = color[2];
   imageData.data[offset + 3] = color[3];
}


function colorsMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

var fillStack=[];
function fillPixel(x, y, targetColor, fillColor,imageData) {
  const currentColor =  getPixel(x, y,imageData);
  if ( colorsMatch(currentColor, targetColor)) {
     setPixel(x, y, fillColor,imageData);
     fillStack.push([x + 1, y, targetColor, fillColor]);
     fillStack.push([x - 1, y, targetColor, fillColor]);
     fillStack.push([x, y + 1, targetColor, fillColor]);
     fillStack.push([x, y - 1, targetColor, fillColor]);
  }
}

function fillCol(imageData) {
  if ( fillStack.length) {
    let range =  fillStack.length;

    for (let i = 0; i < range; i++) {
       fillPixel(
         fillStack[i][0],
         fillStack[i][1],
         fillStack[i][2],
         fillStack[i][3],
         imageData
      );
    }

     fillStack.splice(0, range);

     fillCol(imageData);
  } else {
    
     cntx.putImageData( imageData, 0, 0);
     update_page_image();
     fillStack = [];
  }
}

function getPixel(x, y,imageData) {
  if (
    x < 0 ||
    y < 0 ||
    x >=imageData.width ||
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

socket.on('bucketFill',(data)=>{
  console.log("bucketFill");
  loc=data.loc;
  floodFill(data.loc.x,data.loc.y,data.rc);
})
socket.on('drawing', async (data) => {
  console.log(data);
  strok = true;
  document.getElementById('strokewidth').value = data.sw;
  document.getElementById('strokecolor').value = data.strokColor;
  stroke_properties(cntx);
  await draw1(data);
})

socket.on('stopdrawing', async () => {
  console.log("yes");
  strok = false;
  await update_page_image();
})


socket.on('drawRect', (data) => {

  strok = true;
  draw_rect_helper(data);

})

socket.on('stopRect', (data) => {
  check_tools();
  drawer_check = 0;
  loc = data.loc;
  controlPoint = data.controlPoint;
  stop_rect();
})

socket.on('drawCircle',(data)=>{
  strok=true;
  drawer_check=0;
  draw_circle(data);
})

socket.on('stopCircle',(data)=>{
  check_tools();
  drawer_check=0;
  loc=data.loc;
  controlPoint=data.controlPoint;
  stop_circle();
})
socket.on('drawLine',(data)=>{
  strok=true;
  drawer_check=0;
  draw_line(data);
})

socket.on('stopLine',(data)=>{
  check_tools();
  drawer_check=0;
  loc=data.loc;
  controlPoint=data.controlPoint;
  stop_line();
})

socket.on("eraser",(data)=>{
  drawer_check=0;
  lstrokecolor=data.lstrokecolor;
  lstrokewidth=data.lstrokewidth;
  start_eraser();
})

socket.on('stopEraser',()=>{
  drawer_check=0;
  stop_eraser();
})
socket.on('undodo', async () => {
  undo_check = 0;
  await undo();
})
socket.on("redoDo", async () => {
  console.log("redo");
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
  drawing_setup();

})

socket.on('clearCanvas', () => {
  clear_check = 0;
  clear_page(cntx);
});


function download_img() {
  var link = document.createElement('a');
  link.download = 'filename.png';
  link.href = document.getElementById('canvas1').toDataURL();

  link.click();

  socket.emit('shareSocials');

}