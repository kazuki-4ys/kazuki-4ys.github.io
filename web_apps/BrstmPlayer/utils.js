function clamp16(val){
    if (val > 32767) return 32767;
    if (val < -32768) return -32768;
    return val;
}

function memcpy(dest, destIndex, src, srcIndex, length){
    for(var i = 0; i < length; i++)dest[destIndex++] = src[srcIndex++];
}

function bytesCut(data,addr,size){
    var buf = new Uint8Array(size);
    for(var i = 0;i < size;i++){
        buf[i] = data[addr + i];
    }
    return buf;
}

function int16ToBytes(data,addr,val,isLE){
    if(val < 0)val += 0x10000;
    if(isLE){
        data[addr + 1] = val >>> 8;
        data[addr] = val & 0xff;
    }else{
        data[addr] = val >>> 8;
        data[addr + 1] = val & 0xff;
    }
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

function bytesToInt16(data,addr,isLE){
    var dest = bytesToUint16(data,addr,isLE);
    if(dest & 0x8000)dest -= 0x10000;
    return dest;
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

function bytesToUint16(data,addr,isLE){
    if(isLE)return (data[addr + 1] << 8) + data[addr];
    return (data[addr] << 8) + data[addr + 1];
}