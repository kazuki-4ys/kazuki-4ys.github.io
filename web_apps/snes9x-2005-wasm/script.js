const SAMPLE_RATE = 32050;

var isFullScreen = false;
var isModuleInited = false;
var isMenuDisplay = true;
var ac = null;
var dummyBufferSource = null;
var keyInput = 0;
var softPadInput = 0;
var g = new gamepad();
console.log(g);
function testPad(){
  console.log("gamepadconnectedHandler called");
  //テスト用
if(g.gamepads[0].id === "JC-W01U (Vendor: 056e Product: 2007)"){
  g.buttonRemappers[0][0] = 14;//Y
  g.buttonRemappers[0][1] = 6;//X
  g.buttonRemappers[0][2] = 15;//B
  g.buttonRemappers[0][3] = 7;//A
  g.buttonRemappers[0][4] = 5;//L
  g.buttonRemappers[0][5] = 4;//R
  g.buttonRemappers[0][6] = -1;
  g.buttonRemappers[0][7] = -1;
  g.buttonRemappers[0][8] = 13;//SELECT
  g.buttonRemappers[0][9] = 12;//START
  g.axesRemappers[0].length = 22;
  for(var i = 0;i < g.axesRemappers[0].length;i++)g.axesRemappers[0][i] = -1;
  g.axesRemappers[0][18] = 8;
  g.axesRemappers[0][19] = 9;
  g.axesRemappers[0][20] = 10;
  g.axesRemappers[0][21] = 11;
}
}
g.gamepadconnectedHandler = testPad;

function el(id) {
  return document.getElementById(id);
}

//キー入力
document.addEventListener("keydown", (e) =>{
  console.log(e);
  switch(e.key){
    case "ArrowRight":
      //スーファミ右
      keyInput |= (1 << 8);
      break;
    case "ArrowLeft":
      //スーファミ左
      keyInput |= (1 << 9);
      break;
    case "ArrowDown":
      //スーファミ下
      keyInput |= (1 << 10);
      break;
    case "ArrowUp":
      //スーファミ上
      keyInput |= (1 << 11);
      break;
    case "a":
      //スーファミA
      keyInput |= (1 << 7);
      break;
    case "z":
      //スーファミB
      keyInput |= (1 << 15);
      break;
    case "x":
      //スーファミX
      keyInput |= (1 << 6);
      break;
    case "s":
      //スーファミY
      keyInput |= (1 << 14);
      break;
    case "d":
      //スーファミL
      keyInput |= (1 << 5);
      break;
    case "c":
      //スーファミR
      keyInput |= (1 << 4);
      break;
    case "Enter":
      //スーファミ START
      keyInput |= (1 << 12);
      break;
    case "Shift":
      keyInput |= (1 << 13);
      break;
      //スーファミ SELECT
  }
});

document.addEventListener("keyup", (e) =>{
  switch(e.key){
    case "ArrowRight":
      //スーファミ右
      keyInput &= (0xFFFFFFFF ^ (1 << 8));
      break;
    case "ArrowLeft":
      //スーファミ左
      keyInput &= (0xFFFFFFFF ^ (1 << 9));
      break;
    case "ArrowDown":
      //スーファミ下
      keyInput &= (0xFFFFFFFF ^ (1 << 10));
      break;
    case "ArrowUp":
      //スーファミ上
      keyInput &= (0xFFFFFFFF ^ (1 << 11));
      break;
    case "a":
      //スーファミA
      keyInput &= (0xFFFFFFFF ^ (1 << 7));
      break;
    case "z":
      //スーファミB
      keyInput &= (0xFFFFFFFF ^ (1 << 15));
      break;
    case "x":
      //スーファミX
      keyInput &= (0xFFFFFFFF ^ (1 << 6));
      break;
    case "s":
      //スーファミY
      keyInput &= (0xFFFFFFFF ^ (1 << 14));
      break;
    case "d":
      //スーファミL
      keyInput &= (0xFFFFFFFF ^ (1 << 5));
      break;
    case "c":
      //スーファミR
      keyInput &= (0xFFFFFFFF ^ (1 << 4));
      break;
    case "Enter":
      //スーファミ START
      keyInput &= (0xFFFFFFFF ^ (1 << 12));
      break;
    case "Shift":
      keyInput &= (0xFFFFFFFF ^ (1 << 13));
      break;
      //スーファミ SELECT
  }
});

class MyFileReader extends FileReader{
  constructor(_buttonElement, filter){
      super();
      this.inputElement = document.createElement("input");
      this.inputElement.type = "file";
      this.inputElement.accept = filter;
      this.buttonElement = _buttonElement;
      this.buttonElement.addEventListener("click", {handleEvent: this.buttonClickHandler, self: this});
      this.inputElement.addEventListener("change", {handleEvent: this.inputChangeHandler, self: this});
      this.loadHandlerFunc = null;
      this.loadHandlerArgs = null;
      this.addEventListener("load", (e) => {
          e.target.fileData = new Uint8Array(e.target.result);
          if(e.target.loadHandlerFunc !== null)e.target.loadHandlerFunc(e.target.loadHandlerArgs);
      });
  }
  inputChanged(e){
      var tmp = e.target.files;
      if(tmp){
          var f = tmp[0];
          console.log(f);
          this.fileName = f.name;
          this.readAsArrayBuffer(f);
      }
  }
  inputChangeHandler(e){
      this.self.inputChanged(e);
  }
  buttonClickHandler(e){
      this.self.inputElement.value = "";
      this.self.inputElement.click();
  }
}

function exitMenu(){
  el("menu").style.display = "none";
  isMenuDisplay = false;
}

var romFr = new MyFileReader(el("loadRomButton"), ".sfc,.smc");
romFr.loadHandlerFunc = () => {
  romPtr = setUint8ArrayToCMemory(romFr.fileData);
  Module._startWithRom(romPtr, romFr.fileData.length, SAMPLE_RATE);
  Module._my_free(romPtr);
  exitMenu();
};

var sramFr = new MyFileReader(el("loadSramButton"), ".srm");
sramFr.loadHandlerFunc = () => {
  var fileData = sramFr.fileData;
  if(fileData.length > 0x20000)fileData = fileData.subarray(0, 0x20000);//Memory.SRAMへの書き込む際のオーバーフローを防止
  sramPtr = setUint8ArrayToCMemory(fileData);
  Module._loadSram(fileData.length, sramPtr);
  Module._my_free(sramPtr);
  exitMenu();
};

/*function enableSound(){//ユーザーの動きで呼び出す(ボタンを押させるとか)
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if(!AudioContext)return;
  ac = new AudioContext({sampleRate: SAMPLE_RATE});
  dummyBufferSource = ac.createBufferSource();
  dummyBufferSource.loop = true;
  dummyBufferSource.loopStart = 0;
  dummyBufferSource.loopEnd = 0.5;
  dummyBufferSource.buffer = ac.createBuffer(2, 0.5 * SAMPLE_RATE, SAMPLE_RATE);
  dummyBufferSource.connect(ac.destination);
  dummyBufferSource.start();
}*/

function setUint8ArrayToCMemory(src){
  var buffer = Module._my_malloc(src.length);
  Module.HEAP8.set(src, buffer);
  return buffer;
}

let c = el("output");
c.width = 256;
c.height = 224;
let ctx = c.getContext("2d");
let imgData = ctx.getImageData(0, 0, 512, 448);

Module.onRuntimeInitialized = async _ => {
  isModuleInited = true;
  //fetchRom();
  //テスト用
}

function fetchRom(){
fetch("rom.sfc")
    .then(response => {
        return response.arrayBuffer();
    })
    .then(arrayBuffer => {
      var rom = new Uint8Array(arrayBuffer);
      var romPtr = setUint8ArrayToCMemory(rom);
      Module._startWithRom(romPtr, rom.length, SAMPLE_RATE);
      Module._my_free(romPtr);
    })
    .catch(error => {
});}

function requestFrame(){
  run1fr();
  requestAnimationFrame(requestFrame);
}

requestFrame();

function run1fr(){
  if(!isModuleInited)return;
  if(isMenuDisplay)return;
  Module._setJoypadInput(keyInput | softPadInput);
  Module._mainLoop();
  var frameBufferPtr = Module._getScreenBuffer();
  var frameBufferRawData = new Uint8Array(Module.HEAP8.buffer, frameBufferPtr, 512 * 448 * 4);
  for(var i = 0;i < 512 * 448 * 4;i++)imgData.data[i] = frameBufferRawData[i];
  ctx.putImageData(imgData, 0, 0);
}

function fileSave(data,fn){
  var blob;
  if(typeof data == 'string'){
      var byteString = atob(data.split( "," )[1]);
      for( var i=0, l=byteString.length, content=new Uint8Array( l ); l>i; i++ ) {
          content[i] = byteString.charCodeAt(i);
      }
      blob = new Blob([content]);
  }else{
      blob = new Blob([data]);
  }
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fn;
  link.click();
}

function saveSram(){
  Module._saveSramRequest();
  var sramSize = Module._getSaveSramSize();
  if(sramSize == 0)return;
  var sramPtr = Module._getSaveSram();
  var sram = new Uint8Array(new Uint8Array(Module.HEAP8.buffer, sramPtr, sramSize));
  Module._my_free(sram);
  fileSave(sram, "save.srm");
}

el("menuCloseButton").addEventListener("click", (e) => {
  exitMenu();
});

el("saveSramButton").addEventListener("click", (e) => {
  if(!isModuleInited)return;
  saveSram();
});

el("aboutButton").addEventListener("click", (e) => {
  el("squareButtonParentParent").style.display = "none";
  el("aboutParent").style.display = "flex";
  el("menuHeaderRightMessage").style.display = "block";
  el("menuHeaderLeftMessage").innerHTML = "About Snes9x-2005-wasm";
});

el("menuHeaderLeftMessageChild").addEventListener("click", (e) => {
  el("aboutParent").style.display = "none";
  el("squareButtonParentParent").style.display = "grid";
  el("menuHeaderRightMessage").style.display = "none";
  el("menuHeaderLeftMessage").innerHTML = "Snes9x-2005-wasm Menu";
});

function menuOpen(e){
  el("menu").style.display = "flex";
  isMenuDisplay = true;
}

el("menuOpen1").addEventListener("click", menuOpen);
el("menuOpen2").addEventListener("click", menuOpen);

function padButtonMousedown(e){
  var target = e.target;
  while(!target.getAttribute("data-snes-button"))target = e.target.parentNode;
  softPadInput |= (1 << Number(target.getAttribute("data-snes-button")));
}

function padButtonMouseup(e){
  var target = e.target;
  while(!target.getAttribute("data-snes-button"))target = e.target.parentNode;
  softPadInput &= (0xFFFFFFFF ^ (1 << Number(target.getAttribute("data-snes-button"))));
}

var buttonIDs = ["AButton", "BButton", "XButton", "YButton", "LButton","RButton", "STButton", "SEButton", "DRButton", "DLButton", "DDButton", "DUButton"];

buttonIDs.forEach(function(buttonID){
  el(buttonID).addEventListener("mousedown", padButtonMousedown);
  el(buttonID).addEventListener("touchstart", padButtonMousedown);
  el(buttonID).addEventListener("mouseup", padButtonMouseup);
  el(buttonID).addEventListener("mouseleave", padButtonMouseup);
  el(buttonID).addEventListener("touchend", padButtonMouseup);
});