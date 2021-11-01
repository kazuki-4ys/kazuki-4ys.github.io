var brstmOpen = document.getElementById("brstmOpen");
var cd = document.getElementById("cd");
var cdMsg = document.getElementById("cdMsg");
var decodeMsg = document.getElementById("decodeMsg");
var levelmeter = document.getElementById("levelmeter");
var levelDivs = Array(10);
var time = document.getElementById("time");
var backButton = document.getElementById("backButton");
var playButton = document.getElementById("playButton");
var trackButton = document.getElementById("trackButton");
var errMsgHideTimer = false;

for(var i = 0; i < 21;i++){
    var curDiv = document.createElement("div");
    if(i & 1){
        levelDivs[Math.ceil(i / 2) - 1] = curDiv;
        curDiv.id ="l" + (Math.ceil(i / 2) - 1);
        curDiv.style.flex = "10";
        //curDiv.style.backgroundColor = "#42ADB5";
    }else if(i == 0 || i == 20){
        curDiv.style.flex = "2";
    }else{
        curDiv.style.flex = "1";
    }
    levelmeter.appendChild(curDiv);
}

function cdMsgResizer(){
    if(!sp.valid)return;
    cdMsg.style.width = String(cd.clientWidth / 1.414) + "px";
}
var res = new ResizeObserver(cdMsgResizer);
res.observe(cd);

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
    sp.stop();
    sp.play();
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

function setLeftLevel(lev){
    if(lev > 5)lev = 5;
    for(var i = 0;i < 5; i++){
        levelDivs[i].style.backgroundColor = "#03080B";
    }
    for(var i = 0;i < lev; i++){
        levelDivs[4 - i].style.backgroundColor = "#42ADB5";
    }
}

function setRightLevel(lev){
    if(lev > 5)lev = 5;
    for(var i = 0;i < 5; i++){
        levelDivs[i + 5].style.backgroundColor = "#03080B";
    }
    for(var i = 0;i < lev; i++){
        levelDivs[i + 5].style.backgroundColor = "#42ADB5";
    }
}