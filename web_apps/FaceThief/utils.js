function getCRC32(array,offset,length){
    var table = [];
    var poly = 0xEDB88320;  
    var crc = 0xFFFFFFFF;
 
    //create table
    for(var i = 0; i < 256; i++) {  
        var u = i;  
        for(var j = 0; j < 8; j++) {  
            if(u & 0x1) u = (u >>> 1) ^ poly;  
            else        u >>>= 1;  
        }  
        table.push(u>>>0);
    }
 
    //calculate
    for(var i = 0; i < length; i++)
        crc = ((crc >>> 8) ^ table[array[i + offset] ^ (crc & 0xFF)])>>>0;
    return (~crc)>>>0;
}

function Uint8Cut(data,addr,size){
    var buf = new Uint8Array(size);
    for(var i = 0;i < size;i++){
        buf[i] = data[addr + i];
    }
    return buf;
}

function Uint16toBuf(data,addr,val){
    data[addr] = val >>> 8;
    data[addr + 1] = val & 0xff;
}

function Uint32toBuf(data,addr,val){
    data[addr] = val >>> 24;
    data[addr + 1] = (val >>> 16) & 0xff;
    data[addr + 2] = (val >>> 8) & 0xff;
    data[addr + 3] = val & 0xff;
}

function buftoUint16(data,addr){
    return (data[addr] << 8) + data[addr + 1];
}

function buftoUint32(data,addr){
    return (data[addr] << 24) + (data[addr + 1] << 16) + (data[addr + 2] << 8) + data[addr + 3];
}

function bufToFloat32(data,addr){
    var tmpArr = new Uint8Array(4),i;
    for(i = 0;i < 4;i++){
        tmpArr[i] = data[addr + 4 - i - 1];
    }
    var f = new Float32Array(tmpArr.buffer);
    return Array.prototype.slice.call(f,0);
}

function Float32ToBuf(data,addr,val){
    var f = new Float32Array(1);
    f[0] = val;
    var tmpArr = new Uint8Array(f.buffer),i;
    for(i = 0;i < 4;i++){
        data[addr + 4 - i - 1] = tmpArr[i];
    }
}

function bufToAsciiString(data,addr,length){
    var s = '';
    for(i = 0;i < length;i++){
        if(data[addr + i] === 0)break;
        s += String.fromCharCode(data[addr + i]);
    }
    return s;
}

function bufToUTF16String(data,addr,length){
    var s = '';
    var tmpU16;
    for(i = 0;i < length;i++){
        tmpU16 = (data[i * 2 + addr] << 8) + data[i * 2 + 1 + addr];
        if(tmpU16 === 0)break;
        s += String.fromCharCode(tmpU16);
    }
    return s;
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

function getFileName(s){
    var fn = s.replace(/\\/g,'￥');
    fn = fn.replace(/\//g,'_');
    fn = fn.replace(/\:/g,'：');
    fn = fn.replace(/\*/g,'＊');
    fn = fn.replace(/\?/g,'？');
    fn = fn.replace(/\"/g,'_');
    fn = fn.replace(/\</g,'＜');
    fn = fn.replace(/\>/g,'＞');
    fn = fn.replace(/\|/g,'｜');
    fn = fn.replace(//g,'★');
    fn = fn.replace(//g,'★');
    fn = fn.replace(//g,'★');
    fn = fn.replace(//g,'A');
    fn = fn.replace(//g,'B');
    fn = fn.replace(//g,'C');
    fn = fn.replace(//g,'D');
    fn = fn.replace(//g,'E');
    fn = fn.replace(//g,'!');
    fn = fn.replace(//g,'？');
    fn = fn.replace(//g,'？');
    fn = fn.replace(//g,'？');
    fn = fn.replace(//g,'er');
    fn = fn.replace(//g,'re');
    fn = fn.replace(//g,'e');
    if(!fn)return "default";
    return fn;
}

function htmlEscape(src){
    var str = src.replace(/\</g,'&lt;');
    str = str.replace(/\>/g,'&gt;');
    return str.replace(/\"/g,'&quot;');
}

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