var i;
var reader = new FileReader();
var QRFileReader = new FileReader();

function sendEdit(){
    rawData = null;
    qrBase64 = null;
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

//DOMの取得
var mainForm = document.getElementById('mainForm');
var qrForm = document.getElementById('qrForm');
var open = document.getElementById('open');
var openBtn = document.getElementById('openBtn');
var QrRead = document.getElementById('QrRead');
var QrReadBtn = document.getElementById('QrReadBtn');
var qrReadWait = document.getElementById('qrReadWait');
var save = document.getElementById('save');
var QrGen = document.getElementById('QrGen');
var QrClose = document.getElementById('QrClose');
var QrSave = document.getElementById('QrSave');
var QrImg = document.getElementById('qrCode');
var miiName = document.getElementById('miiName');
var creatorName = document.getElementById('creatorName');
var height = document.getElementById('height');
var weight = document.getElementById('weight');
var heightNum = document.getElementById('heightNum');
var weightNum = document.getElementById('weightNum');
var month = document.getElementById('month');
var day = document.getElementById('day');
var gender = document.getElementById('gender');
var sharing = document.getElementById('sharing');
var allowCopying = document.getElementById('allowCopying');
var favorite = document.getElementById('favorite');
var regionLock = document.getElementById('regionLock');
var characterSet = document.getElementById('characterSet');
var specialMii =  document.getElementById('specialMii');
var profanityFlag = document.getElementById('profanityMii');
var version = document.getElementById('version');
var miiId = [MII_ID_LENGTH];
var consoleId = [CONSOLE_ID_LENGTH];
var creatorMAC = [MAC_ADDR_LENGTH];
var colorButton = [12];
for(i = 0;i < MII_ID_LENGTH;i++){
    miiId[i] = document.getElementById('m' + i);
}

for(i = 0;i < CONSOLE_ID_LENGTH;i++){
    consoleId[i] = document.getElementById('c' + i);
}

for(i = 0;i < MAC_ADDR_LENGTH;i++){
    creatorMAC[i] = document.getElementById('mac' + i);
}

for(i = 0;i < 12;i++){
    colorButton[i] = document.getElementById('colorButton' + i);
}
//DOMにイベント追加

for(i = 0;i < MII_ID_LENGTH;i++){
    miiId[i].addEventListener('change',(event) => {
        var id = Number(event.target.getAttribute('id').replace('m',''));
        var tmp = stoh(event.target.value);
        if(tmp < 0 || tmp > 255 || (tmp !== 0 && !tmp)){
            setUI();
            return;
        }
        editMii.miiID[id] = tmp;
        if(id === 0){
            if(!(editMii.miiID[id] & 0x80))editMii.sharing = false;
        }
        setUI();
        sendEdit();
    });
}

for(i = 0;i < CONSOLE_ID_LENGTH;i++){
    consoleId[i].addEventListener('change',(event) => {
        var id = Number(event.target.getAttribute('id').replace('c',''));
        var tmp = stoh(event.target.value);
        if(tmp < 0 || tmp > 255 || (tmp !== 0 && !tmp)){
            setUI();
            return;
        }
        editMii.consoleID[id] = tmp;
        setUI();
        sendEdit();
    });
}

for(i = 0;i < MAC_ADDR_LENGTH;i++){
    creatorMAC[i].addEventListener('change',(event) => {
        var id = Number(event.target.getAttribute('id').replace('mac',''));
        var tmp = stoh(event.target.value);
        if(tmp < 0 || tmp > 255 || (tmp !== 0 && !tmp)){
            setUI();
            return;
        }
        editMii.creatorMAC[id] = tmp;
        setUI();
        sendEdit();
    });
}

gender.addEventListener('click',(event) => {
    if(editMii.isGirl){
        editMii.isGirl = false;
    }else{
        editMii.isGirl = true;
    }
    setUI();
    sendEdit();
});

sharing.addEventListener('click',(event) => {
    if(editMii.sharing){
        editMii.sharing = false;
    }else{
        editMii.sharing = true;
        editMii.miiID[0] |= 0x80;
    }
    setUI();
    sendEdit();
});

allowCopying.addEventListener('click',(event) => {
    if(editMii.allowCopying){
        editMii.allowCopying = false;
    }else{
        editMii.allowCopying = true;
    }
    setUI();
    sendEdit();
});

favorite.addEventListener('click',(event) => {
    if(editMii.isFavorite){
        editMii.isFavorite = false;
    }else{
        editMii.isFavorite = true;
    }
    setUI();
    sendEdit();
});

regionLock.addEventListener('change',(event) => {
    editMii.regionLock = Number(regionLock.value);
    setUI();
});

characterSet.addEventListener('change',(event) => {
    editMii.characterSet = Number(characterSet.value);
    setUI();
});

specialMii.addEventListener('click',(event) => {
    if(editMii.miiID[0] & 0x80){
        editMii.miiID[0] &= 0x7f;
        editMii.sharing = false;
    }else{
        editMii.miiID[0] |= 0x80;
    }
    setUI();
    sendEdit();
});

profanityFlag.addEventListener('click',(event) => {
    if(editMii.profanityFlag){
        editMii.profanityFlag = false;
    }else{
        editMii.profanityFlag = true;
    }
    setUI();
    sendEdit();
});

miiName.addEventListener('change',(event) => {
    editMii.name = miiName.value;
    setUI();
    sendEdit();
});

creatorName.addEventListener('change',(event) => {
    editMii.creatorName = creatorName.value;
    setUI();
    sendEdit();
});

height.addEventListener('change',(event) => {
    editMii.height = height.value;
    setUI();
    sendEdit();
});

heightNum.addEventListener('change',(event) => {
    var tmp = ston(heightNum.value);
    if(tmp < 0 || tmp > 127 || (tmp !== 0 && !tmp)){
        setUI();
        return;
    }
    editMii.height = tmp;
    setUI();
    sendEdit();
});

weight.addEventListener('change',(event) => {
    editMii.weight = weight.value;
    setUI();
    sendEdit();
});

weightNum.addEventListener('change',(event) => {
    var tmp = ston(weightNum.value);
    if(tmp < 0 || tmp > 127 || (tmp !== 0 && !tmp)){
        setUI();
        return;
    }
    editMii.weight = tmp;
    setUI();
    sendEdit();
});

version.addEventListener('change',(event) => {
    editMii.version = Number(version.value);
    setUI();
    sendEdit();
});

for(i = 0;i < 12;i++){
    colorButton[i].addEventListener('click',(event) => {
        editMii.favColor = Number(event.target.getAttribute('id').replace('colorButton',''));
        setUI();
        sendEdit();
    });
}
month.addEventListener('change',(event) => {
    var tmp = ston(month.value);
    if(tmp < 0 || tmp > 12 || (tmp !== 0 && !tmp)){
        setUI();
        return;
    }
    editMii.month = tmp;
    setUI();
    sendEdit();
});

day.addEventListener('change',(event) => {
    var tmp = ston(day.value);
    if(tmp < 0 || tmp > 31 || (tmp !== 0 && !tmp)){
        setUI();
        return;
    }
    editMii.day = tmp;
    setUI();
    sendEdit();
});
//空白削除
function deleteSpace(string){
    return string.replace(/\s+/g, "");
}
//文字列を10進数に変換
function ston(a){
    var string = deleteSpace(a);
    var i,dec,num = 0;
    for(i = 0;i < string.length;i++){
        dec = getDec(string.charAt(i));
        if(dec === -1)return null;
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
//文字列を16進数に変換
function stoh(a){
    var string = deleteSpace(a);
    var i,hex,num = 0;
    for(i = 0;i < string.length;i++){
        hex = getHex(string.charAt(i));
        if(hex === -1)return null;
        num = num * 16 + hex;
    }
    return num;
}
function getHex(char){
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
        case 'a':
        case 'A':
        case 'ａ':
        case 'Ａ':
            return 10;
        case 'b':
        case 'B':
        case 'ｂ':
        case 'Ｂ':
            return 11;
        case 'c':
        case 'C':
        case 'ｃ':
        case 'Ｃ':
            return 12;
        case 'd':
        case 'D':
        case 'ｄ':
        case 'Ｄ':
            return 13;
        case 'e':
        case 'E':
        case 'ｅ':
        case 'Ｅ':
            return 14;
        case 'f':
        case 'F':
        case 'ｆ':
        case 'Ｆ':
            return 15;
        default:
            return -1;
    }
}

function getString(int){
    var str = int.toString(16);
    if(str.length < 2)str = '0' + str;
    return str;
}

function setUI(){
    miiName.value = editMii.name;
    creatorName.value = editMii.creatorName;
    for(i = 0;i < MII_ID_LENGTH;i++){
        miiId[i].value = getString(editMii.miiID[i]);
    }
    for(i = 0;i < CONSOLE_ID_LENGTH;i++){
        consoleId[i].value = getString(editMii.consoleID[i]);
    }
    for(i = 0;i < MAC_ADDR_LENGTH;i++){
        creatorMAC[i].value = getString(editMii.creatorMAC[i]);
    }
    height.value = editMii.height;
    heightNum.value = editMii.height;
    weight.value = editMii.weight;
    weightNum.value = editMii.weight;
    version.value = editMii.version.toString(10);
    if(editMii.month !== 0){
        month.value = editMii.month;
    }else{
        month.value = '';
    }
    if(editMii.day !== 0){
        day.value = editMii.day;
    }else{
        day.value = '';
    }
    if(editMii.isGirl){
        gender.innerHTML = 'Female';
    }else{
        gender.innerHTML = 'Male';
    }
    if(editMii.sharing){
        sharing.innerHTML = 'Yes';
    }else{
        sharing.innerHTML = 'No';
    }
    if(editMii.allowCopying){
        allowCopying.innerHTML = 'Yes';
    }else{
        allowCopying.innerHTML = 'No';
    }
    if(editMii.isFavorite){
        favorite.innerHTML = '<img src=\"../MiiInfoEditorLite/img/favorite.png\">';
    }else{
        favorite.innerHTML = '<img src=\"../MiiInfoEditorLite/img/none.png\">';
    }
    regionLock.value = editMii.regionLock.toString(10);
    characterSet.value = editMii.characterSet.toString(10);
    if(editMii.miiID[0] & 0x80){
        specialMii.checked = false;
    }else{
        specialMii.checked = true;
    }
    if(editMii.profanityFlag){
        profanityFlag.checked = true;
    }else{
        profanityFlag.checked = false;
    }
    for(i = 0;i < 12;i++){
        if(i === editMii.favColor){
            colorButton[i].setAttribute('class','selectColor');
        }else{
            colorButton[i].setAttribute('class','notSelectColor');
        }
    }
};

function fileCheck(){
    var buf = new Uint8Array(reader.result);
    if(buf.length === MII_FILE_SIZE){
        if(buf[0x16] === 0 && buf[0x17] === 0){
            miiFileRead(buf);
            return;
        }
    }
    open.value = '';
    alert("invalid file");
}

reader.addEventListener('load',fileCheck,false);
open.addEventListener('change',loadFile,false);
function loadFile(event){
    var tmp = event.target.files;
    if(tmp){
        var f = tmp[0];
        reader.readAsArrayBuffer(f);
    }
}

open.addEventListener('click',function(event){
    event.target.value = '';
});
openBtn.addEventListener('click',function(event){
    open.click();
});

QrRead.addEventListener('change',loadQRFile,false);
function loadQRFile(event){
    var tmp = event.target.files;
    if(tmp){
        var f = tmp[0];
        event.target.value = '';
        if(f.type !== 'image/png' && f.type !== 'image/jpeg' && f.type !== 'image/bmp' && f.type !== 'image/gif'){
            alert('これは画像データではありません。\nMiiスタジオによりSDカードに保存されたJPGファイルをご使用ください。\nThis isn\'t image data.\n Please use JPG file generated by Mii Maker.');
            return;
        }
        QRFileReader.readAsDataURL(f);
    }
}
QrRead.addEventListener('click',function(event){
    event.target.value = '';
});
QrReadBtn.addEventListener('click',function(event){
    QrRead.click();
});
QRFileReader.addEventListener('load',function(event){
    mainForm.style.display = 'none';
    qrForm.style.display = 'none';
    qrReadWait.style.display = 'block';
    var image = new Image();
    image.addEventListener('load',function(event){
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        //cnavasのサイズ設定
        var cnvsH = event.target.naturalHeight;
        var cnvsW = event.target.naturalWidth;
        canvas.setAttribute('width', cnvsW);
        canvas.setAttribute('height', cnvsH);
        //描画
        ctx.drawImage(event.target, 0, 0, cnvsW, cnvsH);
        //QRコード読み取り
        var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var qrResult = jsQR(img.data, img.width, img.height);
        qrReadWait.style.display = 'none';
        mainForm.style.display = 'block';
        if(!qrResult){
            alert('QRコードを読み取れませんでした。\nMiiスタジオによりSDカードに保存されたJPGファイルをご使用ください。\nCannot read QR code.\n Please use JPG file generated by Mii Maker.');
            return;
        }
        if(qrResult.binaryData.length !== 0x70){
            alert('これはMiiのQRコードではありません。\nThis isn\'t Mii QR code');
            return;
        }
        var data = decodeAesCcm(new Uint8Array(qrResult.binaryData));
        if(data.length === MII_FILE_SIZE){
            if(data[0x16] === 0 && data[0x17] === 0){
                miiFileRead(data);
                return;
            }
        }
        alert('これはMiiのQRコードではありません。\nThis isn\'t Mii QR code');
    });
    image.src = event.target.result;
});

save.addEventListener('click',function(event){
    if(!rawData)miiEncode();
    fileSave(rawData,'default.3dsmii');
});

QrGen.addEventListener('click',function(event){
    if(!qrBase64)qrEncode();
    QrImg.src = qrBase64;
    console.log(qrBase64);
    mainForm.style.display = 'none';
    qrForm.style.display = 'block';
});

QrClose.addEventListener('click',function(event){
    qrForm.style.display = 'none';
    mainForm.style.display = 'block';
});

QrSave.addEventListener('click',function(event){
    fileSave(qrBase64,'qrcode.png');
});

setTimeout(setUI,1);