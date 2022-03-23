var title = document.getElementById("title");
var description = document.getElementById("description");
var ossLicense = document.getElementById("ossLicense");
var noScript = document.getElementById("noScript");
var initWaiting = document.getElementById("initWaiting");
var initFail = document.getElementById("initFail");
var defaultDiv = document.getElementById("default");
var musicOpen = document.getElementById("musicOpen");
var musicButton = document.getElementById("musicButton");
var musicButtonMsg = document.getElementById("musicButtonMsg");
var musicErrorMsg = document.getElementById("musicErrorMsg");
var channelCount =  document.getElementById("channelCount");
var sampleRate = document.getElementById("sampleRate");
var loopStart = document.getElementById("loopStart");
var loopEnd = document.getElementById("loopEnd");
var buildButton = document.getElementById("buildButton");
var paramsSettings = document.getElementById("paramsSettings");
var encodeWaiting = document.getElementById("encodeWaiting");
var loopCheckBox = document.getElementById("loopCheckBox");
var progressBarFilled = document.getElementById("progressBarFilled");
var saveButton = document.getElementById("saveButton");
var footerOss = document.getElementById("footerOss");
var footerBack = document.getElementById("footerBack");
var startAgain = document.getElementById("startAgain");
var checkedImg = document.createElement("img");
checkedImg.src = "checked.png";
var noneImg = document.createElement("img");
noneImg.src = "none.png";
var saveLink = document.createElement('a');
saveLink.download = "output.brstm";

var isDecoding = false;
var mX;
var soundParams;
var rawPcm16;
var lang = (navigator.language) ? navigator.language : navigator.userLanguage;
var islangJpn = lang && lang.toLowerCase().indexOf("ja") !== -1;
if(!islangJpn){
    description.innerHTML = "<h1>Super Easy Online BRSTM Maker</h1>";
    initWaiting.innerHTML = "Preparing...<br>Please wait a moment.";
    initFail.innerHTML = "An error has ocurred during initialize μ-wave";
    document.getElementById("defaultMsg").innerHTML = "Welcome to μ-wave!<br>μ-wave is web-based BRSTM maker using WebAssembly.<br>Multi-Channel BRSTM is also supported.<br>Let's drop your mp3 or wave file now!";
    musicButtonMsg.innerHTML = "Drop sound file or click!<br>supported file:mp3, wave";
    document.getElementById("channelCountMsg").innerHTML = "Select Channels:";
    document.getElementById("loopCheckBoxMsg").innerHTML = "Loop";
    document.getElementById("loopStartMsg").innerHTML = "Loop start(Samples):";
    document.getElementById("loopEndMsg").innerHTML = "Loop end(Samples):";
    document.getElementById("buildButtonMsg").innerHTML = "Build BRSTM!";
    document.getElementById("encodingMsg").innerHTML = "Encoding...";
    document.getElementById("saveButtonMsg").innerHTML = "Save BRSTM";
    footerOss.innerHTML = "OSS in use";
    footerBack.innerHTML = "Back";
    startAgain.innerHTML = "Start again";
}
fetch("giza2.png")
    .then(response => {
        return response.arrayBuffer();
    })
    .then(arrayBuffer => {
    progressBarFilled.style.background = "url(" + uint8ArrayToBlobURL(arrayBuffer) + ")";
    })
    .catch(error => {
});

function uint8ArrayToBlobURL(data){
    var blob = new Blob([data]);
    return window.URL.createObjectURL(blob);
}

//文字列を10進数に変換
function ston(string){
    var i,dec,num = 0;
    for(i = 0;i < string.length;i++){
        dec = getDec(string.charAt(i));
        if(dec === -1)return -1;
        num = num * 10 + dec;
    }
    return num;
}

function getDec(char){
    switch(char){
        case '0':
        case '０':
            return 0;
        case '1':
        case '１':
            return 1;
        case '2':
        case '２':
            return 2;
        case '3':
        case '３':
            return 3;
        case '4':
        case '４':
            return 4;
        case '5':
        case '５':
            return 5;
        case '6':
        case '６':
            return 6;
        case '7':
        case '７':
            return 7;
        case '8':
        case '８':
            return 8;
        case '9':
        case '９':
            return 9;
        default:
            return -1;
    }
}

var reader = new FileReader();

window.addEventListener('dragover', function(ev){
    ev.preventDefault();
}, false);
window.addEventListener('drop', function(ev){
    ev.preventDefault();
    ev.stopPropagation();
}, false);

var soundWorker = new Worker('sound/sound.js');
noScript.style.display =  "none";
initWaiting.style.display = "block";
soundWorker.postMessage({
    cmd: "init",
});

soundWorker.onmessage = function(e) {
    //console.log(e);
    var cmd = e.data.cmd;
    switch(cmd){
        case "init_result":
            if(e.data.result){
                initWaiting.style.display =  "none";
                defaultDiv.style.display = "block";
                footerOss.style.display = "block";
            }else{
                initWaiting.style.display =  "none";
                initFail.style.display = "block";
            }
            break;
        case "decode_result":
            isDecoding = false;
            if(islangJpn){
                musicButtonMsg.innerHTML = "音声ファイルをドロップorクリック!<br>対応ファイル:mp3, wave";
            }else{
                musicButtonMsg.innerHTML = "Drop sound file or click!<br>supported format:mp3, wave";
            }
            if(e.data.result){
                soundParams = e.data.result.soundParams;
                rawPcm16 = e.data.result.rawPcm16;
                channelCount.value = "2";
                if(islangJpn){
                    sampleRate.innerHTML = "サンプリング周波数:" + String(soundParams[0]) + "Hz";
                }else{
                    sampleRate.innerHTML = "Sample rate:" + String(soundParams[0]) + "Hz";
                }
                loopStart.value = String(soundParams[3]);
                loopEnd.value = String(soundParams[4]);
                soundParams[6] = String(channelCount.value);
                if(soundParams[2]){
                    loopCheckBox.src = checkedImg.src;
                }else{
                    loopCheckBox.src = noneImg.src;
                }
                footerOss.style.display = "none";
                startAgain.style.display = "block";
                defaultDiv.style.display = "none";
                paramsSettings.style.display = "block";
            }else{
                if(islangJpn){
                    musicErrorMsg.innerHTML = "無効なファイルです";
                }else{
                    musicErrorMsg.innerHTML = "invalid file";
                }
            }
            break;
        case "progress_report":
            progressMsg.innerHTML = String(Math.round(100 * e.data.result)) + "%";
            progressBarFilled.style.width = String(100 * e.data.result) + "%";
            break;
        case "encode_result":
            saveLink.href = uint8ArrayToBlobURL(e.data.result);
            progressMsg.innerHTML = "100%";
            progressBarFilled.style.width = "100%";
            saveButton.style.display = "grid";
    }
}

document.body.addEventListener("mousemove", function(e){
    mX = e.pageX;
});

musicButton.addEventListener('click',(event) => {
    if(isDecoding)return;
    musicOpen.value = '';
    musicOpen.click();
});

loopCheckBox.addEventListener('click',(event) => {
    if(soundParams[2]){
        loopCheckBox.src = noneImg.src;
        soundParams[2] = 0;
    }else{
        loopCheckBox.src = checkedImg.src;
        soundParams[2] = 1;
    }
});

buildButton.addEventListener('click',(event) => {
    saveButton.style.display = "none";
    progressBarFilled.style.width = "0%";
    paramsSettings.style.display = "none";
    encodeWaiting.style.display = "block";
    soundWorker.postMessage({
        cmd: "encode",
        soundParams: soundParams
    });
});

channelCount.addEventListener('change',(event) => {
    soundParams[6] = Number(channelCount.value);
});

loopStart.addEventListener('change',(event) => {
    var tmp = ston(loopStart.value);
    if(tmp > -1 && tmp < soundParams[4]){
        soundParams[3] = tmp;
    }
    loopStart.value = soundParams[3].toString(10);
});

loopEnd.addEventListener('change',(event) => {
    var tmp = ston(loopEnd.value);
    if(tmp > soundParams[3] && tmp < soundParams[1]){
        soundParams[4] = tmp;
    }
    loopEnd.value = soundParams[4].toString(10);
});

musicOpen.addEventListener('change',(event) => {
    var tmp = event.target.files;
    if(tmp){
        isDecoding = true;
        if(islangJpn){
            musicButtonMsg.innerHTML = "デコード中...";
        }else{
            musicButtonMsg.innerHTML = "Decoding...";
        }
        musicErrorMsg.innerHTML = "";
        var f = tmp[0];
        reader.readAsArrayBuffer(f);
    }
},false);

musicButton.addEventListener('drop', function(event){
    event.stopPropagation();
    event.preventDefault();
    if(isDecoding)return;
    var tmp = event.dataTransfer.files;
    if(tmp){
        isDecoding = true;
        if(islangJpn){
            musicButtonMsg.innerHTML = "デコード中...";
        }else{
            musicButtonMsg.innerHTML = "Decoding...";
        }
        musicErrorMsg.innerHTML = "";
        var f = tmp[0];
        reader.readAsArrayBuffer(f);
    }
});

saveButton.addEventListener('click', function(event){
    saveLink.click();
});

footerOss.addEventListener('click', function(event){
    if(isDecoding)return;
    if(islangJpn){
        title.innerHTML = "使用しているOSS";
    }else{
        title.innerHTML = "OSS in use";
    }
    description.innerHTML = "<a href=\"https://github.com/Thealexbarney/DspTool\"><h1>DspTool</h1></a>";
    defaultDiv.style.display = "none";
    ossLicense.style.display = "block";
    footerOss.style.display = "none";
    footerBack.style.display = "block";
});

footerBack.addEventListener('click', function(event){
    title.innerHTML = "μ-wave";
    if(islangJpn){
        description.innerHTML = "<h1>超お手軽オンラインBRSTM Maker</h1>";
    }else{
        description.innerHTML = "<h1>Super Easy Online BRSTM Maker</h1>";
    }
    ossLicense.style.display = "none";
    defaultDiv.style.display = "block";
    footerBack.style.display = "none";
    footerOss.style.display = "block";
});

startAgain.addEventListener('click', function(event){
    location.reload();
});

reader.addEventListener('load',(event) => {
    var buf = new Uint8Array(reader.result);
    soundWorker.postMessage({
        cmd: "decode",
        src: buf
    });
});