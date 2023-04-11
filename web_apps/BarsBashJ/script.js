var waitingMsgDiv = document.getElementById("waitingMsgDiv");
var waitingMsg = document.getElementById("waitingMsg");
var alertMsgDiv = document.getElementById("alertMsgDiv");
var alertMsg = document.getElementById("alertMsg");
var alertButton = document.getElementById("alertButton");
var barsLoadButton = document.getElementById("barsLoadButton");
var barsFileNameDisplay = document.getElementById("barsFileNameDisplay");
var bfstmLoadButton = document.getElementById("bfstmLoadButton");
var trackListSelect = document.getElementById("trackListSelect");
var patchButton = document.getElementById("patchButton");
var saveButton = document.getElementById("saveButton");
var bfstmFileNameDisplay = document.getElementById("bfstmFileNameDisplay");

var bars = null;
var bfstp = null;
var trackListInBars;
var saveBarsCache = null;

function addSelectionToTrackListSelect(index, value){
    var option = document.createElement("option");
    option.value = index.toString();
    option.innerHTML = value;
    trackListSelect.insertBefore(option, null);
}

function disableAllButton(){
    barsLoadButton.setAttribute("disabled", "true");
    bfstmLoadButton.setAttribute("disabled", "true");
    patchButton.setAttribute("disabled", "true");
    saveButton.setAttribute("disabled", "true");
}

function enableAllButton(){
    barsLoadButton.removeAttribute("disabled");
    bfstmLoadButton.removeAttribute("disabled");
    patchButton.removeAttribute("disabled");
    saveButton.removeAttribute("disabled");
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

alertButton.addEventListener("click", (e) => {
    alertMsgDiv.style.display = "none";
    enableAllButton();
});

function replaceExtension(src, origExt, replaceExt){
    var origExtLength = origExt.length;
    if (origExtLength > src.length) return src;
    if(src.slice(-1 * origExtLength) != origExt)return src;
    return src.slice(0, src.length - origExtLength) + replaceExt;
}

function displayPleaseWait(e){
    disableAllButton();
    waitingMsgDiv.style.display = "grid";
    waitingMsg.innerHTML = "Please wait...";
}

var barsFR = new MyFileReader(barsLoadButton, ".bars");
barsFR.loadHandlerFunc = barsLoadedHandler;
function barsLoadedHandler(){
    console.log(barsFR.fileData);
    var b = new Bars(barsFR.fileData);
    waitingMsgDiv.style.display = "none";
    if((!b.valid) || (!b.containBfstp())){
        alertMsg.innerHTML = "Invalid file";
        alertMsgDiv.style.display = "grid";
        return;
    }
    barsFileNameDisplay.innerHTML = barsFR.fileName;
    bars = b;
    saveBarsCache = barsFR.fileData;
    enableAllButton();
    trackListInBars = Array(0);
    for(var i = 0;i < bars.Audio.length;i++){
        var curAudioFileName = bars.Audio[i].fileName;
        if(curAudioFileName.slice(-6) != ".bfstp")continue;
        trackListInBars.push(replaceExtension(curAudioFileName, ".bfstp", ".bfstm"));
    }
    trackListInBars.sort();
    trackListSelect.innerHTML = "";
    for(var i = 0;i < trackListInBars.length; i++){
        addSelectionToTrackListSelect(i, trackListInBars[i]);
    }
    trackListSelect.value = "0";
    if(bfstp === null)return;
    var trackListInBarsIndex = trackListInBars.indexOf(bfstmFR.fileName);
    if(trackListInBarsIndex < 0)return;
    trackListSelect.value = trackListInBarsIndex.toString();
}
barsFR.inputElement.addEventListener("change", displayPleaseWait);

var bfstmFR = new MyFileReader(bfstmLoadButton, ".bfstm");
bfstmFR.loadHandlerFunc = bfstmLoadedHandler;
bfstmFR.inputElement.addEventListener("change", displayPleaseWait);
function bfstmLoadedHandler(){
    var b = new Bfstp(bfstmFR.fileData);
    waitingMsgDiv.style.display = "none";
    if(!b.valid){
        alertMsg.innerHTML = "Invalid file";
        alertMsgDiv.style.display = "grid";
        return;
    }
    var tmpBfstp = b.saveForMK8DX();
    if(tmpBfstp === null){
        alertMsg.innerHTML = "Bfstm is too short";
        alertMsgDiv.style.display = "grid";
        return;
    }
    bfstmFileNameDisplay.innerHTML = bfstmFR.fileName;
    bfstp = tmpBfstp;
    enableAllButton();
    if(bars === null)return;
    var trackListInBarsIndex = trackListInBars.indexOf(bfstmFR.fileName);
    if(trackListInBarsIndex < 0)return;
    trackListSelect.value = trackListInBarsIndex.toString();
}

patchButton.addEventListener("click", (e) => {
    if(!(bars && bfstp))return;
    disableAllButton();
    bars.findAudioFileByFileName(replaceExtension(trackListInBars[trackListSelect.value], ".bfstm", ".bfstp")).data = bfstp;
    saveBarsCache = null;
    alertMsg.innerHTML = "Patch applied to BGM.bars. Please note that the patched BGM.bars is not yet saved on your computer. Remember to click \"Save BARS\" to save it!";
    alertMsgDiv.style.display = "grid";
});

saveButton.addEventListener("click", (e) => {
    if(!(bars && bfstp))return;
    if(saveBarsCache === null){
        disableAllButton();
        waitingMsgDiv.style.display = "grid";
        waitingMsg.innerHTML = "Please wait...";
        saveBarsCache = bars.save();
        waitingMsgDiv.style.display = "none";
        enableAllButton();
    }
    fileSave(saveBarsCache, "BGM.bars");
});