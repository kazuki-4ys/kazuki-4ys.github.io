var noScript = document.getElementById("noScript");
var defaultDiv = document.getElementById("default");
var fileOpen = document.getElementById("fileOpen");
var fileButton = document.getElementById("fileButton");
var waitingMsg = document.getElementById("waitingMsg");
var resultDiv = document.getElementById("result");
var resultTextArea = document.getElementById("resultTextArea");
var reloadButton = document.getElementById("reloadButton");
var clipBoard = document.getElementById("clipBoard");
var copiedText = document.getElementById("copiedText");

var isDecoding = false;

function deleteMe(me){
    me.parentNode.removeChild(me);
}

if(Uint8Array && FileReader){
    noScript.style.display = "none";
    defaultDiv.style.display = "block";
}

if(!navigator.clipboard){
    deleteMe(clipBoard);
}

var reader = new FileReader();

function readFiles(tmp){
    if(isDecoding)return;
    waitingMsg.innerHTML = "";
    if(tmp){
        var f = tmp[0];
        if(f.size > (8 * 1024 * 1024)){
            waitingMsg.innerHTML = "ファイルが大きすぎます";
            return;
        }
        isDecoding = true;
        waitingMsg.innerHTML = "エンコード中...";
        reader.readAsArrayBuffer(f);
    }
}

window.addEventListener('dragover', function(event){
    event.preventDefault();
}, false);
window.addEventListener('drop', function(event){
    event.preventDefault();
    event.stopPropagation();
}, false);

fileButton.addEventListener('click', function(event){
    fileOpen.value = "";
    fileOpen.click();
});

fileButton.addEventListener('drop', function(event){
    event.stopPropagation();
    event.preventDefault();
    readFiles(event.dataTransfer.files);
});

fileOpen.addEventListener('change', function(event){
    readFiles(event.target.files);
});

clipBoard.addEventListener('click', function(event){
    if(navigator.clipboard){
        navigator.clipboard.writeText(resultTextArea.value);
        copiedText.innerHTML = "クリップボードにコピーしました!!";
    }
});

reloadButton.addEventListener('click', function(event){
    location.reload();
});

reader.addEventListener('load',(event) => {
    var result = decodeBase64(new Uint8Array(reader.result));
    console.log(result);
    resultTextArea.value = result;
    defaultDiv.style.display = "none";
    console.log(result);
    resultDiv.style.display = "grid";
});