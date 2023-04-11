class Amta{
    constructor(src){
        this.valid = false;
        this.isLE = false;
        if(src.length < 0x1C)return;
        if(bytesToUint32(src, 0, false) != 0x414D5441)return;//check magic
        if(bytesToUint16(src, 4, false) == 0xFFFE)this.isLE = true;
        var strgOffset = bytesToUint32(src, 0x18, this.isLE);
        if(src.length < (strgOffset + 8))return;
        var strgSize = bytesToUint32(src, strgOffset + 4, this.isLE) + 8;
        if(src.length < (strgOffset + strgSize))return;
        this.strg = Uint8Cut(src, strgOffset, strgSize);
        this.valid = true;
    }
    getFileName(){
        if(!this.valid)return "";
        return bytesToString(this.strg, 8, this.strg.length - 8);
    }
}

class AmtaFile{
    constructor(_fileName, _data, _hash){
        this.fileName = _fileName;
        this.data = _data;
        this.hash = _hash;
    }
}

class SimpleFile{
    constructor(_fileName, _data){
        this.fileName = _fileName;
        this.data = _data;
    }
}

class Bars{
    constructor(src){
        this.valid = false;
        this.bfstpCount = 0;
        if(src.length < 0x10)return;
        if(bytesToUint32(src, 0, false) != 0x42415253)return;
        if(bytesToUint16(src, 8, false) == 0xFFFE){
            this.isLE = true;
        }else{
            this.isLE = false;
        }
        var fileCount = bytesToUint32(src, 0xC, this.isLE);
        this.MetaData = new Array(fileCount);
        this.Audio = new Array(fileCount);
        if(src.length < (0x10 + fileCount * 0xC))return;
        for(var i = 0;i < fileCount;i++){
            var amtaOffset = bytesToUint32(src, 0x10 + fileCount * 4 + i * 8, this.isLE);
            if(src.length < (amtaOffset + 0xC))return;
            var amtaLE = false;
            if(bytesToUint16(src, amtaOffset + 4, false) == 0xFFFE)amtaLE = true;
            var amtaSize = bytesToUint32(src, amtaOffset + 8, amtaLE);
            if(src.length < (amtaOffset + amtaSize))return;
            var amtaData = Uint8Cut(src, amtaOffset, amtaSize);
            var curAmta = new Amta(amtaData);
            if(!curAmta.valid)return;
            this.MetaData[i] = new AmtaFile(curAmta.getFileName() + ".amta", amtaData,  bytesToUint32(src, 0x10 + i * 4, this.isLE));
            var audioOffset = bytesToUint32(src, 0x10 + fileCount * 4 + i * 8 + 4, this.isLE);
            if(src.length < (audioOffset + 0x10))return;
            var isBfstp = false;
            var audioMagicNumber = bytesToUint32(src, audioOffset, false);
            if(audioMagicNumber == 0x46574156){
                isBfstp = false;
            }else if(audioMagicNumber == 0x46535450){
                isBfstp = true;
            }else{
                return;
            }
            var audioLE = false;
            if(bytesToUint16(src, audioOffset + 4, false) == 0xFFFE)audioLE = true;
            var audioSize = bytesToUint32(src, audioOffset + 0xC, audioLE);
            if(src.length < (audioOffset + audioSize))return;
            if(isBfstp){
                this.Audio[i] = new SimpleFile(curAmta.getFileName() + ".bfstp", Uint8Cut(src, audioOffset, audioSize));
                this.bfstpCount++;
            }else{
                this.Audio[i] = new SimpleFile(curAmta.getFileName() + ".bfwav", Uint8Cut(src, audioOffset, audioSize));
            }
        }
        this.valid = true;
        return;
    }
    containBfstp(){
        if(this.bfstpCount == 0)return false;
        return true;
    }
    findAudioFileByFileName(fileName){
        for(var i = 0;i < this.Audio.length;i++){
            if(fileName == this.Audio[i].fileName)return this.Audio[i];
        }
        return null;
    }
    save(){
        var fileCountToSave = 0;
        var MetaDataToSave = new Array(this.MetaData.length);
        var AudioToSave = new Array(this.Audio.length);
        for(var i = 0;i < this.MetaData.length;i++){
            var curMetaDataToSave = this.MetaData[i];
            var curAmtaToSave = new Amta(curMetaDataToSave.data);
            var curAudioToSave = this.findAudioFileByFileName(curAmtaToSave.getFileName() + ".bfwav");
            if(curAudioToSave == null)curAudioToSave = this.findAudioFileByFileName(curAmtaToSave.getFileName() + ".bfstp");
            if(curAudioToSave == null)continue;
            MetaDataToSave[fileCountToSave] = curMetaDataToSave;
            AudioToSave[fileCountToSave] = curAudioToSave;
            fileCountToSave++;
        }
        var dest = new Uint8Array(0x10 + 0xC * fileCountToSave);
        for(var i = 0;i < fileCountToSave;i++){
            dest = Uint8Cat(dest, MetaDataToSave[i].data);
        }
        var padSize = 0x40 - dest.length % 0x40;
        if(padSize != 0x40) dest = Uint8Cat(dest, new Uint8Array(padSize));
        for (var i = 0;i < fileCountToSave;i++){
            padSize = 0x40 - (AudioToSave[i].data.length % 0x40);
            if(padSize == 0x40){
                dest = Uint8Cat(dest, AudioToSave[i].data);
            }else{
                dest = Uint8Cat(dest, AudioToSave[i].data, new Uint8Array(padSize));
            }
        }
        uint32ToBytes(dest, 0, 0x42415253, false);
        uint32ToBytes(dest, 4, dest.length, this.isLE);
        uint16ToBytes(dest, 8, 0xFEFF, this.isLE);
        uint16ToBytes(dest, 0xA, 0x101, this.isLE);
        uint32ToBytes(dest, 0xC, fileCountToSave, this.isLE);
        var curFileOffset = 0x10 + 0xC * fileCountToSave;
        for(var i = 0;i < fileCountToSave;i++){
            uint32ToBytes(dest, 0x10 + 4 * i, MetaDataToSave[i].hash, this.isLE);
            uint32ToBytes(dest, 0x10 + 4 * fileCountToSave + 8 * i, curFileOffset, this.isLE);
            curFileOffset += MetaDataToSave[i].data.length;
        }
        padSize = 0x40 - (curFileOffset % 0x40);
        if(padSize != 0x40){
            curFileOffset += padSize;
        }
        for(var i = 0;i < fileCountToSave;i++){
            uint32ToBytes(dest, 0x10 + 4 * fileCountToSave + 8 * i + 4, curFileOffset, this.isLE);
            curFileOffset += AudioToSave[i].data.length;
            padSize = 0x40 - (AudioToSave[i].data.length % 0x40);
            if(padSize != 0x40)
            {
                curFileOffset += padSize;
            }
        }
        return dest;
    }
}