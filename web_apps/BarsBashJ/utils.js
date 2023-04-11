function memcpy(dest, destIndex, src, srcIndex, length){
    for(var i = 0;i < length;i++)dest[destIndex + i] = src[srcIndex + i];
}

function Uint8Cut(data,addr,size){
    var buf = new Uint8Array(size);
    for(var i = 0;i < size;i++){
        buf[i] = data[addr + i];
    }
    return buf;
}

function Uint8Cat(){
    var destLength = 0
    for(var i = 0;i < arguments.length;i++)destLength += arguments[i].length;
    var dest = new Uint8Array(destLength);
    var index = 0;
    for(i = 0;i < arguments.length;i++){
        dest.set(arguments[i],index);
        index += arguments[i].length;
    }
    return dest;
}

function uint16ToBytes(data,addr,val,isLE){
    if(isLE){
        data[addr + 1] = val >>> 8;
        data[addr] = val & 0xff;
    }else{
        data[addr] = val >>> 8;
        data[addr + 1] = val & 0xff;
    }
}

function uint32ToBytes(data,addr,val,isLE){
    if(isLE){
        data[addr + 3] = val >>> 24;
        data[addr + 2] = (val >>> 16) & 0xff;
        data[addr + 1] = (val >>> 8) & 0xff;
        data[addr] = val & 0xff;
    }else{
        data[addr] = val >>> 24;
        data[addr + 1] = (val >>> 16) & 0xff;
        data[addr + 2] = (val >>> 8) & 0xff;
        data[addr + 3] = val & 0xff;
    }
}

function bytesToUint16(data,addr,isLE){
    if(isLE)return (data[addr + 1] << 8) + data[addr];
    return (data[addr] << 8) + data[addr + 1];
}

function bytesToUint32(data,addr,isLE){
    if(isLE)return (data[addr + 3] << 24) + (data[addr + 2] << 16) + (data[addr + 1] << 8) + data[addr];
    return (data[addr] << 24) + (data[addr + 1] << 16) + (data[addr + 2] << 8) + data[addr + 3];
}

function bytesToString(data,addr,length){
    var s = '';
    for(i = 0;i < length;i++){
        if(data[addr + i] === 0)break;
        s += String.fromCharCode(data[addr + i]);
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