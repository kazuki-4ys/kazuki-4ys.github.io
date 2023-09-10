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
var buildButtonMsg = document.getElementById("buildButtonMsg");
var paramsSettings = document.getElementById("paramsSettings");
var encodeWaiting = document.getElementById("encodeWaiting");
var loopCheckBox = document.getElementById("loopCheckBox");
var testPlayPosDisplay = document.getElementById("testPlayPosDisplay");
var formatSelect = document.getElementById("formatSelect");
var progressBarFilled = document.getElementById("progressBarFilled");
var saveButton = document.getElementById("saveButton");
var saveButtonMsg = document.getElementById("saveButtonMsg");
var footerOss = document.getElementById("footerOss");
var footerBack = document.getElementById("footerBack");
var startAgain = document.getElementById("startAgain");
var checkedImg = document.createElement("img");
checkedImg.src = "checked.png";
var noneImg = document.createElement("img");
noneImg.src = "none.png";
var saveLink = document.createElement('a');
saveLink.download = "output.brstm";
var tps = null;
var sp = null;

class Sound{
    constructor(_rawPcm16, _soundParams){
        this.ac = new (window.AudioContext || window.webkitAudioContext)({sampleRate: _soundParams[0]});
        this.buffer = this.ac.createBuffer(
            2,
            _soundParams[1],
            _soundParams[0],
        );
        if(_soundParams[5] > 1){//2ch以上ある場合
            for(var i = 0;i < 2;i++){
                var curChannelBuffer = this.buffer.getChannelData(i);
                for(var j = 0;j < _soundParams[1];j++)curChannelBuffer[j] = _rawPcm16[i * _soundParams[1] + j] / 0x8000;
            }
        }else{
            for(var i = 0;i < 2;i++){
                var curChannelBuffer = this.buffer.getChannelData(i);
                for(var j = 0;j < _soundParams[1];j++)curChannelBuffer[j] = _rawPcm16[j] / 0x8000;
            }
        }
    }
}

class SoundPlayer{
    constructor(_pcmPtr, _soundParams){
        this.isPlaying = false;
        this.pcmPtr = _pcmPtr;
        this.soundParams = _soundParams;
        this.sampleRate = this.soundParams[0];
        this.sampleLength = this.soundParams[1];
        this.isLooped = false;
        if(this.soundParams[2])this.isLooped = true;
        this.loopStart = this.soundParams[3] / this.soundParams[0];
        this.loopEnd = this.soundParams[4] / this.soundParams[0];
        this.sound = null;
        this.source = null;
        this.offset = 0;
        window.requestAnimationFrame(this.animationFrameHandler.bind(null, this));
    }
    animationFrameHandler(self){
        self.update();
        window.requestAnimationFrame(self.animationFrameHandler.bind(null, self));
    }
    update(){
        if(this.isPlaying){
            var displayTime = this.getCorrectDisplayTime();
            if(displayTime > (this.sampleLength / this.sampleRate) && !this.source.loop){//最後まで再生した
                console.log(displayTime);
                console.log("sound ended!!");
                this.isPlaying = false;
                this.setOffset(0);
                displayTime = 0;
                el("testPlayPauseButton").src = "play.png"
            }
            if(tps)tps.curPosKnob.setValue(displayTime * this.sampleRate);
            if(tps && (!tps.curPosKnob.isKnobGrabbed))testPlayPosDisplay.innerHTML = Math.floor(displayTime * this.sampleRate) + "/" + this.soundParams[1];
        }
        if(tps && tps.curPosKnob.isKnobGrabbed)testPlayPosDisplay.innerHTML = Math.floor(tps.curPosKnob.value) + "/" + this.soundParams[1];
    }
    createSound(){
        this.sound = new Sound(this.pcmPtr, this.soundParams);
    }
    pause(){
        if(!this.isPlaying)return;
        this.offset = this.getCorrectDisplayTime();
        if(tps && (!tps.curPosKnob.isKnobGrabbed)){
            tps.curPosKnob.setValue(this.offset * this.sampleRate);
            testPlayPosDisplay.innerHTML = Math.floor(this.offset * this.sampleRate) + "/" + this.soundParams[1];
        }
        this.createBufferSource();
        this.isPlaying = false;
    }
    play(){
        if(this.isPlaying)return;
        if(!this.source)this.createBufferSource();
        this.source.connect(this.sound.ac.destination);
        this.startTime = this.sound.ac.currentTime;
        this.source.start(this.startTime, this.offset);
        this.isPlaying = true;
    }
    getCorrectDisplayTime(){
        if(!this.isPlaying)return this.offset;
        var displayTime = this.sound.ac.currentTime - this.startTime;
        if(displayTime < 0)displayTime = 0;
        displayTime += this.offset;
        var loopStartSec = this.loopStart;
        var loopEndSec = this.loopEnd;
        if(this.source && this.source.loop){
            while(displayTime >= loopEndSec){
                displayTime -= (loopEndSec - loopStartSec);
            }
        }
        return displayTime;
    }
    getCorrectOffset(val){
        if(val < 0)val = 0;
        if(val > (this.sampleLength / this.sampleRate))val = (this.sampleLength / this.sampleRate);
        return val;
    }
    createBufferSource(){
        if(!this.sound)this.createSound();
        try{
            if(this.source)this.source.stop();
        }catch(e){
            console.log(e);
        }
        this.source = this.sound.ac.createBufferSource();
        this.source.buffer = this.sound.buffer;
        if(this.isLooped && (this.offset < this.loopEnd)){
            this.source.loopStart = this.loopStart;
            this.source.loopEnd = this.loopEnd;
            this.source.loop = true;
        }
    }
    changeLoopSettings(_isLooped, _loopStart, _loopEnd){
        this.offset = this.getCorrectDisplayTime();
        this.offset = this.getCorrectOffset(this.offset);
        this.isLooped = _isLooped;
        this.loopStart = _loopStart;
        this.loopEnd = _loopEnd;
        this.setOffset(this.offset);
    }
    setOffset(val){
        console.log(val);
        if(!this.sound)this.createSound();
        this.offset = this.getCorrectOffset(val);
        this.createBufferSource();
        if(tps && (!tps.curPosKnob.isKnobGrabbed))testPlayPosDisplay.innerHTML = Math.floor(this.offset * this.sampleRate) + "/" + this.soundParams[1];
        if(this.isPlaying){
            this.source.connect(this.sound.ac.destination);
            this.startTime = this.sound.ac.currentTime;
            this.source.start(this.startTime, this.offset);
        }
    }
}

function el(id){
    return document.getElementById(id);
}
  

var buildType = 0;
var isDecoding = false;
var mX;
var soundParams;
var rawPcm16;
var lang = (navigator.language) ? navigator.language : navigator.userLanguage;
var islangJpn = lang && lang.toLowerCase().indexOf("ja") !== -1;
if(!islangJpn){
    description.innerHTML = "<h1>Super Easy Online BRSTM/BCSTM/BFSTM Maker</h1>";
    el("initWaitingChild").innerHTML = "Preparing...<br>Please wait a moment.";
    el("initFailChild").innerHTML = "An error has ocurred during initialize μ-wave";
    document.getElementById("defaultMsg").innerHTML = "Welcome to μ-wave!<br>μ-wave is web-based BRSTM maker using WebAssembly.<br>Multi-Channel BRSTM is also supported.<br>Let's drop your mp3, wave or ogg file now!";
    musicButtonMsg.innerHTML = "Drop sound file or click!<br>supported file:mp3, wave, ogg";
    document.getElementById("channelCountMsg").innerHTML = "Select Channels:";
    document.getElementById("loopCheckBoxMsg").innerHTML = "Loop";
    document.getElementById("loopStartMsg").innerHTML = "Loop start(Samples):";
    document.getElementById("loopEndMsg").innerHTML = "Loop end(Samples):";
    el("formatSelectLineMsg").innerHTML = "Output format:";
    buildButtonMsg.innerHTML = "Build BRSTM!";
    document.getElementById("encodingMsg").innerHTML = "Encoding...";
    saveButtonMsg.innerHTML = "Save BRSTM";
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
initWaiting.style.display = "flex";
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
                defaultDiv.style.display = "flex";
                footerOss.style.display = "block";
            }else{
                initWaiting.style.display =  "none";
                initFail.style.display = "flex";
            }
            break;
        case "decode_result":
            isDecoding = false;
            if(islangJpn){
                musicButtonMsg.innerHTML = "音声ファイルをドロップorクリック!<br>対応ファイル:mp3, wave, ogg";
            }else{
                musicButtonMsg.innerHTML = "Drop sound file or click!<br>supported format:mp3, wave, ogg";
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
                tps = new TestPlaySlider(soundParams[1], el("sliderBar"), el("sliderKnob"), el("sliderBar").querySelector(".loopStartKnob"), el("sliderBar").querySelector(".loopEndKnob"));
                tps.loopStartKnob.value = soundParams[3];
                tps.loopEndKnob.value = soundParams[4];
                sp = new SoundPlayer(rawPcm16, soundParams);
                tps.curPosKnob.valueChangedHandleFunc = curPosKnobValueChangedHandler;
                tps.loopStartKnob.valueChangedHandleFunc = loopStartKnobValueChangedHandler;
                tps.loopEndKnob.valueChangedHandleFunc = loopEndValueChangedHandler;
                testPlayPosDisplay.innerHTML = "0/" + soundParams[1];
                //sp.play();
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
        soundParams[2] = 0;
    }else{
        soundParams[2] = 1;
    }
    applyLoopSettingsToUIAndSp();
});

function applyLoopSettingsToUIAndSp(){
    var isLooped = false;
    if(soundParams[2] == 1){
        isLooped = true;
        loopCheckBox.src = checkedImg.src;
    }else{
        loopCheckBox.src = noneImg.src;
    }
    loopStart.value = soundParams[3].toString(10);
    loopEnd.value = soundParams[4].toString(10);
    tps.loopStartKnob.setValue(soundParams[3]);
    tps.loopEndKnob.setValue(soundParams[4]);
    sp.changeLoopSettings(isLooped, soundParams[3] / soundParams[0], soundParams[4] / soundParams[0]);
}

function curPosKnobValueChangedHandler(arg, value){
    sp.setOffset(value / soundParams[0]);
}

function loopStartKnobValueChangedHandler(arg, value){
    value = Math.floor(value);
    if(value >= (soundParams[1] - 1)){
        soundParams[4] = soundParams[1] - 1;
        soundParams[3] = soundParams[4] - 1;
        applyLoopSettingsToUIAndSp();
        return;
    }
    if(value >= soundParams[4])soundParams[4] = value + 1;
    soundParams[3] = value;
    applyLoopSettingsToUIAndSp();
}

function loopEndValueChangedHandler(arg, value){
    value = Math.floor(value);
    if(value >= soundParams[1])value = soundParams[1] - 1;
    if(value < 2){
        soundParams[4] = 1;
        soundParams[3] = 0;
        applyLoopSettingsToUIAndSp();
        return;
    }
    if(value <= soundParams[3])soundParams[3] = value - 1;
    soundParams[4] = value;
    applyLoopSettingsToUIAndSp();
}

el("testPlayPauseButton").addEventListener('click', event => {
    if(sp.isPlaying){
        sp.pause();
        el("testPlayPauseButton").src = "play.png";
    }else{
        sp.play();
        el("testPlayPauseButton").src = "stop.png";
    }
});

formatSelect.addEventListener('change', (event =>{
    buildType = Number(formatSelect.value);
    if(islangJpn){
        switch(buildType){
            case 0:
                buildButtonMsg.innerHTML = "BRSTM作成!";
                saveButtonMsg.innerHTML = "BRSTMを保存";
                break;
            case 1:
                buildButtonMsg.innerHTML = "BCSTM作成!";
                saveButtonMsg.innerHTML = "BRSTMを保存";
                break;
            case 2:
                buildButtonMsg.innerHTML = "BFSTM(WiiU)作成!";
                saveButtonMsg.innerHTML = "BFSTM(WiiU)を保存";
                break;
            default:
                buildButtonMsg.innerHTML = "BFSTM(Switch)作成!";
                saveButtonMsg.innerHTML = "BFSTM(Switch)を保存";
                break;
        }
    }else{
        switch(buildType){
            case 0:
                buildButtonMsg.innerHTML = "Build BRSTM!";
                saveButtonMsg.innerHTML = "Save BRSTM";
                break;
            case 1:
                buildButtonMsg.innerHTML = "Build BCSTM!";
                saveButtonMsg.innerHTML = "Save BCSTM";
                break;
            case 2:
                buildButtonMsg.innerHTML = "Build BFSTM(WiiU)!";
                saveButtonMsg.innerHTML = "Save BFSTM(WiiU)";
                break;
            default:
                buildButtonMsg.innerHTML = "Build BFSTM(Switch)!";
                saveButtonMsg.innerHTML = "Save BFSTM(Switch)";
                break;
        }
    }
    switch(buildType){
        case 0:
            saveLink.download = "output.brstm";
            break;
        case 1:
            saveLink.download = "output.bcstm";
            break;
        default:
            saveLink.download = "output.bfstm";
            break;
    }
}));


buildButton.addEventListener('click',(event) => {
    sp.pause();
    saveButton.style.display = "none";
    progressBarFilled.style.width = "0%";
    paramsSettings.style.display = "none";
    encodeWaiting.style.display = "flex";
    soundWorker.postMessage({
        cmd: "encode",
        soundParams: soundParams,
        buildType: buildType
    });
});

channelCount.addEventListener('change',(event) => {
    soundParams[6] = Number(channelCount.value);
});

loopStart.addEventListener('change',(event) => {
    var value = ston(loopStart.value);
    if(value < 0){
        loopStart.value = soundParams[3].toString(10);
        return;
    }
    if(value >= (soundParams[1] - 1)){
        soundParams[4] = soundParams[1] - 1;
        soundParams[3] = soundParams[4] - 1;
        applyLoopSettingsToUIAndSp();
        return;
    }
    if(value >= soundParams[4])soundParams[4] = value + 1;
    soundParams[3] = value;
    applyLoopSettingsToUIAndSp();
});

loopEnd.addEventListener('change',(event) => {
    var value = ston(loopEnd.value);
    if(value < 0){
        loopEnd.value = soundParams[4].toString(10);
        return;
    }
    if(value >= soundParams[1])value = soundParams[1] - 1;
    if(value < 2){
        soundParams[4] = 1;
        soundParams[3] = 0;
        applyLoopSettingsToUIAndSp();
        return;
    }
    if(value <= soundParams[3])soundParams[3] = value - 1;
    soundParams[4] = value;
    applyLoopSettingsToUIAndSp();
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
    description.innerHTML = "";
    defaultDiv.style.display = "none";
    ossLicense.style.display = "flex";
    footerOss.style.display = "none";
    footerBack.style.display = "block";
});

footerBack.addEventListener('click', function(event){
    title.innerHTML = "μ-wave";
    if(islangJpn){
        description.innerHTML = "<h1>超お手軽オンラインBRSTM/BFSTM(Switch) Maker</h1>";
    }else{
        description.innerHTML = "<h1>Super Easy Online BRSTM/BFSTM(Switch) Maker</h1>";
    }
    ossLicense.style.display = "none";
    defaultDiv.style.display = "flex";
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