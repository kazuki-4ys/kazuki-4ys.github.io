function decodeBase64(src){
    var dest = Uint8ArrayToBase64IntArray(src);
    return base64intArrayToString(dest);
}

function setBitToBase64IntArray(dest, index, bit){
    var curCharIndex = Math.floor(index / 6);
    var curBitIndex = index % 6;
    dest[curCharIndex] = (bit << (5 - curBitIndex)) | dest[curCharIndex];
}

function getBitFromUint8Array(src, index){
    var curByteIndex = Math.floor(index / 8);
    var curBitIndex = index % 8;
    return (src[curByteIndex] >> (7 - curBitIndex)) & 1;
}

function Uint8ArrayToBase64IntArray(src){
    var destLenght = Math.ceil((src.length * 8) / 6);
    var dest = new Array(destLenght);
    for(var i = 0;i < destLenght;i++)dest[i] = 0;
    for(var i = 0;i < src.length * 8;i++)setBitToBase64IntArray(dest, i, getBitFromUint8Array(src, i));
    return dest;
}

function base64IntToChar(src){
    if(src == 63)return "/";
    if(src == 62)return "+"
    if(src > 51)return String.fromCharCode(0x30 + (src - 52));
    if(src > 25)return String.fromCharCode(0x61 + (src - 26));
    return String.fromCharCode(0x41 + src);
}

function base64intArrayToString(src){
    var dest = "";
    for(var i = 0;i < src.length;i++)dest += base64IntToChar(src[i]);
    while(dest.length % 4 != 0)dest += "=";
    return dest;
}