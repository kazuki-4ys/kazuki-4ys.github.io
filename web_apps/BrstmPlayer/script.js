const LEVEL_HEIGHT = 32;

var brstmOpen = document.getElementById("brstmOpen");
var cd = document.getElementById("cd");
var cdMsg = document.getElementById("cdMsg");
var decodeMsg = document.getElementById("decodeMsg");
var levelmeter = document.getElementById("levelmeter");
var levelDivs = Array(20);
var levelDivsParent = Array(20);
var time = document.getElementById("time");
var backButton = document.getElementById("backButton");
var playButton = document.getElementById("playButton");
var trackButton = document.getElementById("trackButton");
var errMsgHideTimer = false;
var cdResizedCheckerLastWidth = cd.clientWidth;

for(var i = 0; i < 81;i++){
    var curDiv = document.createElement("div");
    if(i & 1){
        levelDivsParent[Math.ceil(i / 2) - 1] = curDiv;
        curDiv.style.flex = "10";
        curDiv.style.display = "flex";
        curDiv.style.flexDirection = "column";
        //curDiv.style.backgroundColor = "#42ADB5";
    }else{
        curDiv.style.flex = "1";
    }
    levelmeter.appendChild(curDiv);
}

for(var i = 0; i < 40;i++){
    levelDivs[i] = Array(LEVEL_HEIGHT);
    for(var j = 0; j < (LEVEL_HEIGHT << 1); j++){
        var curDiv = document.createElement("div");
        if(j & 1){
            curDiv.style.flex = "10";
            levelDivs[i][(LEVEL_HEIGHT - 1) - (j >>> 1)] = curDiv;
        }else{
            curDiv.style.flex = "1";
        }
        levelDivsParent[i].append(curDiv);
    }
}

function cdMsgResizer(){
    if(!sp.valid)return;
    cdMsg.style.width = String(cd.clientWidth / 1.414) + "px";
}

function cdResizedChecker(){
    if(cdResizedCheckerLastWidth != cd.clientWidth)cdMsgResizer();
    cdResizedCheckerLastWidth = cd.clientWidth;
}

setInterval(cdResizedChecker, 17);

function showDecodeMsg(){
    decodeMsg.innerHTML = "デコード中...";
    cdMsg.style.display = "none";
    decodeMsg.style.display = "block";
}

function showErrMsg(){
    decodeMsg.innerHTML = "無効なファイルです";
    cdMsg.style.display = "none";
    decodeMsg.style.display = "block";
    setTimeout(hideErrMsg, 3000);
}

function hideErrMsg(){
    errMsgHideTimer = false;
    decodeMsg.style.display = "none";
    cdMsg.style.display = "block";
}

window.addEventListener('dragover', function(ev){
    ev.preventDefault();
}, false);
window.addEventListener('drop', function(ev){
    ev.preventDefault();
    ev.stopPropagation();
}, false);

var reader = new FileReader();
var inputFileName;

function fileLoaded(){
    var tmpSp = new SoundPlayer(new Sound(new Uint8Array(reader.result)),inputFileName);
    if(errMsgHideTimer){
        clearTimeout(errMsgHideTimer);
        errMsgHideTimer = false;
    }
    if(tmpSp.valid){
        decodeMsg.style.display = "none";
        cdMsg.style.display = "block";
        sp.stop();
        sp = tmpSp;
        document.getElementById('trackButtonMsg').innerHTML = "トラック1";
        //sp.play();
    }else{
        showErrMsg();
    }
}

reader.addEventListener('load',fileLoaded,false);

function loadFile(event){
    var tmp = event.target.files;
    if(tmp){
        var f = tmp[0];
        console.log(f);
        inputFileName = f.name;
        reader.readAsArrayBuffer(f);
        showDecodeMsg();
    }
}

brstmOpen.addEventListener('change',loadFile,false);

cd.addEventListener('click',function(event){
    brstmOpen.value = "";
    brstmOpen.click();
});

cd.addEventListener('dragover', function(event) {
    event.stopPropagation();
    event.preventDefault();
});

cd.addEventListener('dragleave', function(event) {
    event.stopPropagation();
    event.preventDefault();
});

cd.addEventListener('drop', function(event){
    event.stopPropagation();
    event.preventDefault();
    var tmp = event.dataTransfer.files;
    if(tmp){
        var f = tmp[0];
        inputFileName = f.name;
        reader.readAsArrayBuffer(f);
        showDecodeMsg();
    }
});

backButton.addEventListener('click', function(event){
    sp.setOffset(0);
    sp.cdDeg = 0;
    cdMsg.style.transform = "rotate(0deg)";
});

playButton.addEventListener('click', function(event){
    if(sp.isPlaying){
        sp.pause();
    }else{
        sp.play();
    }
});

trackButton.addEventListener('click', function(event){
    sp.changeTrack();
    document.getElementById('trackButtonMsg').innerHTML = "トラック" + (sp.track + 1);
});

function setLevel(idx, lev){
    if(lev > LEVEL_HEIGHT)lev = LEVEL_HEIGHT;
    for(var i = 0; i < LEVEL_HEIGHT;i++){
        if(lev > i){
            levelDivs[idx][i].style.backgroundColor = "#123133";
        }else{
            levelDivs[idx][i].style.backgroundColor = "#03080B";
        }
    }
}

function clearAllLevel(){
    for(var i = 0;i < 40;i++){
        for(var j = 0; j < LEVEL_HEIGHT;j++)levelDivs[i][j].style.backgroundColor = "#03080B";
    }
}