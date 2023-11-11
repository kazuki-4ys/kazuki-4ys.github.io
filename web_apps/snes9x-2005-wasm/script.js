const SAMPLE_RATE = 36000;

var isFullScreen = false;
var isModuleInited = false;
var isMenuDisplay = true;
var ac = null;
var noSound = false;
var dummyBufferSource = null;
var keyInput = 0;
var softPadInput = 0;
var isVisible = true;
var userMute = false;
var g = new gamepad();
var rightUpBackCloseMenu = true;

function el(id) {
  return document.getElementById(id);
}

var rootElement = document.documentElement ;
rootElement.requestFullscreen = rootElement.requestFullscreen || rootElement.mozRequestFullScreen || rootElement.webkitRequestFullscreen || rootElement.msRequestFullscreen;
document.exitFullscreen = document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.webkitCancelFullScreen || document.msExitFullscreen;

function enableFullScreen(){
  el("fullScreenRoot").style.display = "grid";
  el("fullScreenButtonMsg").innerHTML = "Exit<br>Fullscreen";
  document.getElementsByTagName("body")[0].style.backgroundColor = "#000000";
}

function disableFullScreen(){
  el("fullScreenRoot").style.display = "none";
  el("fullScreenButtonMsg").innerHTML = "Enter<br>Fullscreen";
  document.getElementsByTagName("body")[0].style.backgroundColor = "#eeeeee";
}

"webkitfullscreenchange mozfullscreenchange MSFullscreenChange fullscreenchange".split(" ").forEach((en)=>{
  document.addEventListener(en, (e)=>{
    if(document.fullscreenElement){
      isFullScreen = true;
      enableFullScreen();
    } else {
      isFullScreen = false;
      disableFullScreen();
    }
  });
})

function menuButtonFullScreen(){
  if(!isFullScreen){
    rootElement.requestFullscreen();
  }else{
    document.exitFullscreen();
  }
}

//キー入力
document.addEventListener("keydown", (e) =>{
  console.log(e);
  if(e.keyCode == 122)
  {
    e.keyCode = null;
    e.returnValue = false;
    menuButtonFullScreen();
  }
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

document.onvisibilitychange = function(e) {
  if(document.hidden) {
    isVisible = false;
  }else{
    isVisible = true;
  }
}

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
  if(!ac && (noSound === false))enableSound();
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

var stateFr = new MyFileReader(el("loadStateButton"), ".s95ws");
stateFr.loadHandlerFunc = () => {
  var fileData = stateFr.fileData;
  var statePtr = setUint8ArrayToCMemory(fileData);
  Module._loadState(statePtr, fileData.length);
  Module._my_free(statePtr);
  exitMenu();
};

function scriptNodeProcess(e){
  if(!isModuleInited)return;
  let outputL = e.outputBuffer.getChannelData(0);
  let outputR = e.outputBuffer.getChannelData(1);
  if(isMenuDisplay || !isVisible || userMute){
    for(var i = 0;i < 2048;i++)outputL[i] = 0;
    for(var i = 0;i < 2048;i++)outputR[i] = 0;
  }else{
    var soundBuffer = new Float32Array(Module.HEAPF32.buffer, Module._getSoundBuffer(), 2048 * 2);
    //console.log(soundBuffer);
    for(var i = 0;i < 2048;i++)outputL[i] = soundBuffer[i];
    for(var i = 0;i < 2048;i++)outputR[i] = soundBuffer[i + 2048];
  }
}

function enableSound(){//ユーザーの動きで呼び出す(ボタンを押させるとか)
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if(!AudioContext){
    noSound = true;
    return;
  }
  ac = new AudioContext({sampleRate: SAMPLE_RATE});
  if(!ac){
    noSound = true;
    return;
  }
  var scriptNode = null;
  if(ac.createScriptProcessor){
    scriptNode = ac.createScriptProcessor(2048, 0, 2);
  }else if(ac.createJavaScriptNode){
    scriptNode = ac.createJavaScriptNode(2048, 0, 2);
  }else{
    ac = null;
    noSound = true;
    return;
  }
  scriptNode.onaudioprocess = scriptNodeProcess;
  scriptNode.connect(ac.destination);
}

function setUint8ArrayToCMemory(src){
  var buffer = Module._my_malloc(src.length);
  Module.HEAP8.set(src, buffer);
  return buffer;
}

function canvasSetup(can){
  var dest = Array();
  can.width = 256;
  can.height = 224;
  var canCtx = can.getContext("2d");
  var canImgData = canCtx.getImageData(0, 0, 512, 448);
  dest.push(canCtx);
  dest.push(canImgData);
  return dest;
}

function setFsoSize(fso, root){
  var heightRaito = 0.75;
  var rWidth = root.clientWidth;
  var rHeight = root.clientHeight;
  if((rHeight / rWidth) > heightRaito){
    fso.style.width = rWidth + "px";
    fso.style.height = (rWidth * heightRaito) + "px";
  }else{
    fso.style.height = rHeight + "px";
    fso.style.width = (rHeight / heightRaito) + "px";
  }
}

var root = el("root");
var fso = el("fs_output");
var canvasSetupDest;
canvasSetupDest = canvasSetup(el("output"));
var ctx = canvasSetupDest[0];
var imgData = canvasSetupDest[1];
canvasSetupDest = canvasSetup(fso);
var fs_ctx = canvasSetupDest[0];
var fs_imgData = canvasSetupDest[1];

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
  if(isFullScreen)setFsoSize(fso, root);
  if(!isModuleInited)return;
  if(isMenuDisplay)return;
  Module._setJoypadInput(keyInput | softPadInput | g.getHoldButton());
  Module._mainLoop();
  var frameBufferPtr = Module._getScreenBuffer();
  var frameBufferRawData = new Uint8Array(Module.HEAP8.buffer, frameBufferPtr, 512 * 448 * 4);
  if(isFullScreen){
    for(var i = 0;i < 512 * 448 * 4;i++)fs_imgData.data[i] = frameBufferRawData[i];
    fs_ctx.putImageData(fs_imgData, 0, 0);
  }else{
    for(var i = 0;i < 512 * 448 * 4;i++)imgData.data[i] = frameBufferRawData[i];
    ctx.putImageData(imgData, 0, 0);
  }
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
  Module._my_free(sramPtr);
  fileSave(sram, "save.srm");
}

function saveState(){
  var stateSize = Module._getStateSaveSize();
  var statePtr = Module._saveState();
  if(statePtr == 0)return;
  var state = new Uint8Array(new Uint8Array(Module.HEAP8.buffer, statePtr, stateSize));
  Module._my_free(statePtr);
  fileSave(state, "state.s95ws");
}

el("muteButton").addEventListener("click", (e) => {
  userMute = !userMute;
  if(userMute){
    el("muteButtonMsg").innerHTML = "Unmute";
  }else{
    el("muteButtonMsg").innerHTML = "Mute";
  }
});

el("fullScreenButton").addEventListener("click", (e) => {
  menuButtonFullScreen();
});

el("saveSramButton").addEventListener("click", (e) => {
  if(!isModuleInited)return;
  saveSram();
});

el("saveStateButton").addEventListener("click", (e) => {
  if(!isModuleInited)return;
  saveState();
});

el("aboutButton").addEventListener("click", (e) => {
  rightUpBackCloseMenu = false;
  el("menuHeaderLeftMessageChild").innerHTML = "Back";
  el("squareButtonParentParent").style.display = "none";
  el("aboutParent").style.display = "flex";
  el("menuHeaderLeftMessage").innerHTML = "About Snes9x-2005-wasm";
});

function applySettingsToGamePad(){
  if(g.gamepads[g.curGamepadIndex] === null)return;
  for(var i = 0;i < g.buttonRemappers[g.curGamepadIndex].length;i++)g.buttonRemappers[g.curGamepadIndex][i] = -1;
  for(var i = 0;i < g.axesRemappers[g.curGamepadIndex].length;i++)g.axesRemappers[g.curGamepadIndex][i] = -1;
  var selects = document.getElementsByClassName("buttonRemapSelect");
  for(var i = 0;i < selects.length;i++){
    if(selects[i].value === 0)continue;
    if(selects[i].value - 1 < g.buttonRemappers[g.curGamepadIndex].length)g.buttonRemappers[g.curGamepadIndex][selects[i].value - 1] = Number(selects[i].getAttribute("data-snes-button"));
    var axisRemaptarget = selects[i].value - (1 + g.buttonRemappers[g.curGamepadIndex].length);
    if(axisRemaptarget > -1 && axisRemaptarget < g.axesRemappers[g.curGamepadIndex].length)g.axesRemappers[g.curGamepadIndex][axisRemaptarget] = Number(selects[i].getAttribute("data-snes-button"));
  }
  g.saveSettingsToDict();
  g.saveDictToLocalStorage();
}

function applyGamepadSettingsToUI(){
  var selects = document.getElementsByClassName("buttonRemapSelect");
  for(var i = 0;i < selects.length;i++){
    selects[i].value = g.findValueForOption(Number(selects[i].getAttribute("data-snes-button")));
  }
}

function buttonRemapSelect(e){
  console.log(e);
  g.findGamepads();
  var selectValue = e.target.value;
  //同じ値をもつやつがいないか調べる
  var selects = document.getElementsByClassName("buttonRemapSelect");
  for(var i = 0;i < selects.length;i++){
    if(selects[i].getAttribute("data-snes-button") == e.target.getAttribute("data-snes-button"))continue;
    if(selectValue === selects[i].value){
      e.target.value = 0;
    }
  }
  applySettingsToGamePad();
  applyGamepadSettingsToUI();
}

function createButtonRemapSelectParentParent(){
  g.findGamepads();
  if(!g.gamepads[g.curGamepadIndex]){
    el("gamepadNameShow").innerHTML = "no controller connected";
    el("gamepadButtonSettingsButtonName").style.display = "none";
    el("buttonRemapSelectParentParent").style.display = "none";
    return;
  }
  g.setSettingsFromDict();
  el("gamepadButtonSettingsButtonName").style.display = "block";
  el("buttonRemapSelectParentParent").style.display = "block";
  el("gamepadNameShow").innerHTML = g.gamepads[g.curGamepadIndex].id;
  el("buttonRemapSelectParentParent").innerHTML = "";
  var snesButtonIDs = ["12", "13", "7", "15", "6", "14", "5", "4", "8", "9", "10", "11"];
  for(var i = 0;i < snesButtonIDs.length;i++){
    var template =  el("buttonRemapSelectParentTemplate").content.cloneNode(true);
    var select = template.querySelector(".buttonRemapSelect");
    select.setAttribute("data-snes-button", snesButtonIDs[i]);
    var option = document.createElement("option");
    option.setAttribute("value", "0");
    option.innerHTML = "None";
    select.insertBefore(option, null);
    var curValue = 1;
    for(var j = 0;j < g.gamepads[g.curGamepadIndex].buttons.length;j++){
      option = document.createElement("option");
      option.setAttribute("value", String(curValue));
      option.innerHTML = "Button " + String(j);
      select.insertBefore(option, null);
      curValue++;
    }
    for(var j = 0;j < g.axesRemappers[g.curGamepadIndex].length;j++){
      var curAxeIndex = Math.floor(j / 2);
      option = document.createElement("option");
      option.setAttribute("value", String(curValue));
      if((j & 1) == 0){
        option.innerHTML = "Axis " + String(curAxeIndex) + " +";
      }else{
        option.innerHTML = "Axis " + String(curAxeIndex) + " -";
      }
      select.insertBefore(option, null);
      curValue++;
    }
    select.value = g.findValueForOption(Number(snesButtonIDs[i]));
    select.addEventListener("change", buttonRemapSelect);
    el("buttonRemapSelectParentParent").insertBefore(template, null);
  }
}

el("gamepadSettingsButton").addEventListener("click", (e) => {
  rightUpBackCloseMenu = false;
  el("menuHeaderLeftMessageChild").innerHTML = "Back";
  el("squareButtonParentParent").style.display = "none";
  el("gamepadSettings").style.display = "flex";
  el("menuHeaderLeftMessage").innerHTML = "Gamepad Settings";
  if(g.gamepads.length === 0){
    el("gamepadNameShow").innerHTML = "no controller connected";
    el("gamepadButtonSettingsButtonName").style.display = "none";
    el("buttonRemapSelectParentParent").style.display = "none";
    return;
  }
  createButtonRemapSelectParentParent();
});

el("menuHeaderLeftMessageChild").addEventListener("click", (e) => {
  if(rightUpBackCloseMenu){
    exitMenu();
  }
  el("aboutParent").style.display = "none";
  el("gamepadSettings").style.display = "none";
  el("squareButtonParentParent").style.display = "grid";
  el("menuHeaderLeftMessage").innerHTML = "Snes9x-2005-wasm Menu";
  el("menuHeaderLeftMessageChild").innerHTML = "Close";
  rightUpBackCloseMenu = true;
});

function menuOpen(e){
  el("menu").style.display = "flex";
  isMenuDisplay = true;
}

el("menuOpen1").addEventListener("click", menuOpen);
el("menuOpen2").addEventListener("click", menuOpen);
el("menuOpen3").addEventListener("click", menuOpen);

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