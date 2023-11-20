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
var pstrokewidth = 5;
var pstrokecolor;
var estrokewidth = 30;  //setting strokewidth to 30
var estrokecolor = document.getElementById("boardcolor").value;
var lstrokewidth = document.getElementById("strokewidth").value;
var lstrokecolor = document.getElementById('strokecolor').value;




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

  //locator(event);
  controlPoint.x = loc.x;
  controlPoint.y = loc.y;
  //new piece
  locator(event);
  controlPoint.x = (controlPoint.x + loc.x) / 2;
  controlPoint.y = (controlPoint.y + loc.y) / 2;

  locator(event);

  cntx.quadraticCurveTo(controlPoint.x, controlPoint.y, loc.x, loc.y);

  cntx.stroke();
  cntx.closePath();

  socket.emit('drawing', { loc_prev, controlPoint, sw, strokColor });
}

var clear_check = 1;
function clear_page(cntx_name) {
  undo_arr = [];
  undo_arr_index = 0;
  button_state_checker();
  cntx_name.clearRect(0, 0, canv.width, canv.height);
  cntx_name.fillStyle = document.getElementById("boardcolor").value;
  cntx_name.fillRect(0, 0, canv.width, canv.height);
  if (clear_check == 1) {
    socket.emit("clearCanvas");
  }
  clear_check = 1;
}


function draw1(data) {
  loc = data.loc_prev;
  controlPoint = data.controlPoint;
  if (!strok) { return; }
  cntx.beginPath();
  cntx.moveTo(loc.x, loc.y);
  console.log("yes");
  cntx.quadraticCurveTo(controlPoint.x, controlPoint.y, loc.x, loc.y);
  cntx.stroke();
  cntx.closePath();

}

//rectangle drawing 
var isRectOn = false;
async function start_rect_drawing() {
  console.log(isRectOn);
  if (isRectOn === true) {
    console.log("check stop")
    stop_rect_drawing()

  } else {
    document.getElementById("pagecontainer").style.cursor = 'crosshair';
    console.log("yes_rect");
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



socket.on('drawing', (data) => {
  console.log(data);
  strok = true;
  document.getElementById('strokewidth').value = data.sw;
  document.getElementById('strokecolor').value = data.strokColor;
  stroke_properties(cntx);
  draw1(data);
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
  drawer_check = 0;
  loc = data.loc;
  controlPoint = data.controlPoint;
  stop_rect();
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
  disable_setup();
  stop_rect_drawing();
})

socket.on('enableCanvas', async () => {
  resize();
  toolbox.style.visibility = 'visible';
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