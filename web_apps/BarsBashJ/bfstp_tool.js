const BSTM_PCM_8 = 0;
const BSTM_PCM_16 = 1;
const BSTM_DSP_ADPCM = 2;
const BSTM_IMA_ADPCM = 3;
const BSTM_BLOCK_SIZE = 8192;
BLOCK_COUNT_FOR_MK8DX = 5

class DspAdpcmInfo{
    constructor(src, isLE){
        this.coefs = new Array(16);
        for(var i = 0;i < 16;i++)this.coefs[i] = bytesToUint16(src, i * 2, isLE);
        this.gain = bytesToUint16(src, 0x20, isLE);
        this.predScale = bytesToUint16(src, 0x22, isLE);
        this.hist1 = bytesToUint16(src, 0x24, isLE);
        this.hist2 = bytesToUint16(src, 0x26, isLE);
        this.loopPredScale = bytesToUint16(src, 0x28, isLE);
        this.loopHist1 = bytesToUint16(src, 0x2A, isLE);
        this.loopHist2 = bytesToUint16(src, 0x2C, isLE);
    }
    save(isLE){
        var dest = new Uint8Array(0x2E);
        for(var i = 0;i < 16;i++)uint16ToBytes(dest, i * 2, this.coefs[i], isLE);
        uint16ToBytes(dest, 0x20, this.gain, isLE);
        uint16ToBytes(dest, 0x22, this.predScale, isLE);
        uint16ToBytes(dest, 0x24, this.hist1, isLE);
        uint16ToBytes(dest, 0x26, this.hist2, isLE);
        uint16ToBytes(dest, 0x28, this.loopPredScale, isLE);
        uint16ToBytes(dest, 0x2A, this.loopHist1, isLE);
        uint16ToBytes(dest, 0x2C, this.loopHist2, isLE);
        return dest;
    }
}

class BfstmInfo{
    constructor(src, isLE, bfstmVersion){
        this.valid = false;
        this.isLooped = false;
        if(src.length < 0x10)return;
        var streamInfoOffset = bytesToUint32(src, 0xC, isLE) + 8;
        if(src.length < (streamInfoOffset + 0x44))return;
        if(bfstmVersion >= 0x40000){
            if(src.length < (streamInfoOffset + 0x4C))return;
        }

        //stream info
        this.format = src[streamInfoOffset];
        if(src[streamInfoOffset + 1] != 0)this.isLooped = true;
        this.channelCount = src[streamInfoOffset + 2];
        this.daInfos = new Array(this.channelCount);
        this.sampleRate = bytesToUint32(src, streamInfoOffset + 4, isLE);
        this.loopStart = bytesToUint32(src, streamInfoOffset + 8, isLE);
        this.sampleLength = bytesToUint32(src, streamInfoOffset + 0xC, isLE);
        this.blockCount = bytesToUint32(src, streamInfoOffset + 0x10, isLE);
        this.blockSize = bytesToUint32(src, streamInfoOffset + 0x14, isLE);
        if(this.blockSize != BSTM_BLOCK_SIZE)return;
        this.lastBlockSize = bytesToUint32(src, streamInfoOffset + 0x1C, isLE);
        this.lastBlockSizeWithPad = bytesToUint32(src, streamInfoOffset + 0x24, isLE);
        this.sampleDataOffset = bytesToUint32(src, streamInfoOffset + 0x34, isLE) + 8;
        if(bfstmVersion >= 0x40000){
            this.realLoopStart = bytesToUint32(src, streamInfoOffset + 0x44, isLE);
            this.realLoopEnd = bytesToUint32(src, streamInfoOffset + 0x48, isLE);
        }else{
            this.realLoopStart = this.loopStart;
            this.realLoopEnd = this.sampleLength - 1;
        }

        //channel info
        if(this.format == BSTM_IMA_ADPCM)return;
        if(this.format != BSTM_DSP_ADPCM){
            for(var i = 0;i < this.channelCount;i++){
                this.daInfos[i] = null;
            }
            this.valid = true;
            return;
        }
        var channelInfoOffset = bytesToUint32(src, 0x1C, isLE) + 8;
        if(src.length < (channelInfoOffset + 4))return;
        if(bytesToUint32(src, channelInfoOffset, isLE) != this.channelCount)return;
        if(src.length < (channelInfoOffset + 4 + this.channelCount * 8))return;
        for(var i = 0;i < this.channelCount;i++){
            var _300StructOffset = bytesToUint32(src, channelInfoOffset + 4 + i * 8 + 4, isLE) + channelInfoOffset;
            if(src.length < (_300StructOffset + 8))return;
            var dspAdpcmInfoOffset = bytesToUint32(src, _300StructOffset + 4, isLE) + _300StructOffset;
            if(src.length < (dspAdpcmInfoOffset + 0x2E))return;
            this.daInfos[i] = new DspAdpcmInfo(Uint8Cut(src, dspAdpcmInfoOffset, 0x2E), isLE);
        }
        this.valid = true;
    }
}

class Bfstp{
    constructor(src){
        this.valid = false;
        if(src.length < 0x40)return;
        if(bytesToUint32(src, 0, false) != 0x4653544D)return;
        if(bytesToUint16(src, 4, false) == 0xFFFE){
            this.isLE = true;
        }else if(bytesToUint16(src, 4, false) == 0xFEFF){
            this.isLE = false;
        }else{
            return;
        }
        var bfstmVersion = bytesToUint32(src, 8, this.isLE);
        var chunkCount = bytesToUint16(src, 0x10, this.isLE);
        var curChunk = 0x14;
        var headOffset = 0;
        var headSize = 0;
        var dataOffset = 0;
        var dataSize = 0;
        if(chunkCount != 2 && chunkCount != 3)return;
        for(var i = 0;i < chunkCount;i++){
            var curChunkTag = bytesToUint16(src, curChunk, this.isLE);
            switch(curChunkTag){
                case 0x4000:
                        headOffset = bytesToUint32(src, curChunk + 4, this.isLE);
                        headSize = bytesToUint32(src, curChunk + 8, this.isLE);
                        if(src.length < (headOffset + headSize))return;
                        break;
                case 0x4001:
                        break;
                case 0x4002:
                        dataOffset = bytesToUint32(src, curChunk + 4, this.isLE);
                        dataSize = bytesToUint32(src, curChunk + 8, this.isLE);
                        if(src.length < (dataOffset + dataSize))return;
                        break;
                default:
                        return;
            }
            curChunk += 0xC;
        }
        var bfi = new BfstmInfo(Uint8Cut(src, headOffset, headSize), this.isLE, bfstmVersion);
        this.daInfos = bfi.daInfos;
        this.sampleRate = bfi.sampleRate;
        this.sampleLength = bfi.sampleLength;
        this.format = bfi.format;
        this.channelCount = bfi.channelCount;
        this.isLooped = bfi.isLooped;
        this.loopStart = bfi.loopStart;
        this.realLoopStart = bfi.realLoopStart;
        this.realLoopEnd = bfi.realLoopEnd;
        this.blockCount = bfi.blockCount;
        this.lastBlockSize = bfi.lastBlockSize;
        this.lastBlockSizeWithPad = bfi.lastBlockSizeWithPad;
        this.data = new Uint8Array(this.calcDataLengthPerChannel() * this.channelCount);
        if(!Bfstp.parseDataChunk(Uint8Cut(src, dataOffset, dataSize), this.channelCount, bfi.sampleDataOffset, bfi.blockCount, bfi.blockSize, bfi.lastBlockSize, bfi.lastBlockSizeWithPad, this.data))return;
        if(this.format == BSTM_PCM_16 && this.isLE == false){
            for(var i = 0;i < this.data.length / 2;i++){
                var tmpU16 = bytesToUint16(this.data, i * 2, false);
                uint16toBytes(this.data, i * 2, tmpU16, true);
            }
        }
        this.valid = true;
        return;
    }
    static parseDataChunk(dataChunk, channelCount, sampleDataOffset, blockCount, blockSize, lastBlockSize, lastBlockSizeWithPad, destData){
        var dataSizePerChannelWithPad = (blockCount - 1) * blockSize + lastBlockSizeWithPad;
        var dataSizePerChannel = (blockCount - 1) * blockSize + lastBlockSize;
        if(destData.length != dataSizePerChannel * channelCount)return false;
        if(dataChunk.length < (dataSizePerChannelWithPad * channelCount + sampleDataOffset))return false;
        for(var i = 0;i < channelCount;i++){
            for(var j = 0;j < blockCount;j++){
                if(j == (blockCount - 1)){
                    memcpy(destData, i * dataSizePerChannel + j * blockSize, dataChunk, sampleDataOffset + (channelCount * (blockCount - 1) * blockSize) + i * lastBlockSizeWithPad, lastBlockSize);
                }else{
                    memcpy(destData, i * dataSizePerChannel + j * blockSize, dataChunk, sampleDataOffset + (channelCount * j + i) * blockSize, blockSize);
                }
            }
        }
        return true;
    }
    calcDataLengthPerChannel(){
        switch(this.format){
            case BSTM_PCM_8:
                return this.sampleLength;
            case BSTM_PCM_16:
                return 2 * this.sampleLength;
            case BSTM_DSP_ADPCM:
                var channelLength = Math.floor(this.sampleLength / 14) * 8;
                if((this.sampleLength % 14) != 0){
                    channelLength += (Math.floor(((this.sampleLength % 14) + 1) / 2) + 1);
                }
                return channelLength;
        }
        return 0;
    }
    caluSamplesInBlock(blockSize){
        switch (this.format){
            case BSTM_PCM_8:
                return blockSize;
            case BSTM_PCM_16:
                    return blockSize / 2;
            case BSTM_DSP_ADPCM:
                    var dest = (blockSize / 8) * 14;
                    if (blockSize % 8 != 0) dest += (((blockSize % 8) - 1) * 2);
                    return dest;
        }
        return 0;
    }
    static createChannelInfo_0300(daInfo, isLE){
        var dest = new Uint8Array(8 + 0x2E + 2);
        uint16ToBytes(dest, 0, 0x300, isLE);
        uint32ToBytes(dest, 4, 8, isLE);
        memcpy(dest, 8, daInfo.save(isLE), 0, 0x2E);
        return dest;
    }
    static createRefenceTable_4102(daInfos, isLE){
        var dest;
        if (daInfos[0] === null)
        {
            dest = new Uint8Array(4 + daInfos.length * 8 + 8);
            uint32ToBytes(dest, 0, daInfos.length, isLE);
            for (var i = 0; i < daInfos.length; i++)
            {
                uint16ToBytes(dest, i * 8 + 4, 0x4102, isLE);
                uint32ToBytes(dest, i * 8 + 8, 4 + 8 * daInfos.length, isLE);
            }
            uint32ToBytes(dest, 4 + daInfos.length * 8, 0, isLE);
            uint32ToBytes(dest, 4 + daInfos.length * 8 + 4, 0xFFFFFFFF, isLE);
        }
        else
        {
            dest = new Uint8Array(4 + (8 + 0x38) * daInfos.length);
            uint32ToBytes(dest, 0, daInfos.length, isLE);
            for (var i = 0; i < daInfos.length; i++)
            {
                uint16ToBytes(dest, i * 8 + 4, 0x4102, isLE);
                uint32ToBytes(dest, i * 8 + 8, 4 + daInfos.length * 8 + i * 0x38, isLE);
                memcpy(dest, 4 + daInfos.length * 8 + i * 0x38, Bfstp.createChannelInfo_0300(daInfos[i], isLE), 0, 0x38);
            }
        }
        return dest;
    }
    savePdatChunkForMK8DX(){
        var dataLengthPerChannel = this.calcDataLengthPerChannel();
        var dataSize = BLOCK_COUNT_FOR_MK8DX * BSTM_BLOCK_SIZE * this.channelCount;
        if(this.data.length < dataSize)return null;
        var destSize = dataSize + 0x40;
        var dest = new Uint8Array(destSize);
        uint32ToBytes(dest, 0, 0x50444154, false);
        uint32ToBytes(dest, 4, destSize, true);
        dest[8] = 1;//unkwnon
        uint32ToBytes(dest, 0x10, dataSize, true);
        uint32ToBytes(dest, 0x1C, 0x34, true);
        for(var i = 0;i < this.channelCount;i++){
            for(var j = 0;j < BLOCK_COUNT_FOR_MK8DX;j++){
                memcpy(dest, 0x40 + (j * this.channelCount + i) * BSTM_BLOCK_SIZE, this.data, dataLengthPerChannel * i + (j * BSTM_BLOCK_SIZE), BSTM_BLOCK_SIZE);
            }
        }
        return dest;
    }
    saveForMK8DX(){
        var channelInfo = Bfstp.createRefenceTable_4102(this.daInfos, true);
        var streamInfo = new Uint8Array(0x4C);
        streamInfo[0] = this.format;
        if (this.isLooped)
        {
            streamInfo[1] = 1;
            uint32ToBytes(streamInfo, 8, this.loopStart, true);
            uint32ToBytes(streamInfo, 0x44, this.realLoopStart, true);
            uint32ToBytes(streamInfo, 0x48, this.realLoopEnd, true);
        }
        else
        {
            streamInfo[1] = 0;
            uint32ToBytes(streamInfo, 8, 0, true);
            uint32ToBytes(streamInfo, 0x44, 0, true);
            uint32ToBytes(streamInfo, 0x48, this.sampleLength - 1, true);
        }
        streamInfo[2] = this.channelCount;
        uint32ToBytes(streamInfo, 4, this.sampleRate, true);
        uint32ToBytes(streamInfo, 8, this.loopStart, true);
        uint32ToBytes(streamInfo, 0xC, this.sampleLength, true);
        uint32ToBytes(streamInfo, 0x10, this.blockCount, true);
        uint32ToBytes(streamInfo, 0x14, BSTM_BLOCK_SIZE, true);
        uint32ToBytes(streamInfo, 0x18, this.caluSamplesInBlock(BSTM_BLOCK_SIZE), true);
        var sampleCountInLastBlock = this.sampleLength % this.caluSamplesInBlock(BSTM_BLOCK_SIZE);
        if(sampleCountInLastBlock == 0)sampleCountInLastBlock = this.caluSamplesInBlock(BSTM_BLOCK_SIZE);
        uint32ToBytes(streamInfo, 0x1C, this.lastBlockSize, true);
        uint32ToBytes(streamInfo, 0x20, sampleCountInLastBlock, true);
        uint32ToBytes(streamInfo, 0x24, this.lastBlockSizeWithPad, true);
        uint32ToBytes(streamInfo, 0x28, 4, true);
        uint32ToBytes(streamInfo, 0x2C, 0x3800, true);
        uint16ToBytes(streamInfo, 0x30, 0x1F00, true);
        uint32ToBytes(streamInfo, 0x34, 64 * this.channelCount + 0x100, true);
        uint16ToBytes(streamInfo, 0x38, 0x100, true);
        uint16ToBytes(streamInfo, 0x3C, 0, true);
        uint32ToBytes(streamInfo, 0x40, 0xFFFFFFFF, true);
        var infoChunkHeaderSize = 0x20;
        var infoChunk = new Uint8Array(infoChunkHeaderSize);
        uint32ToBytes(infoChunk, 0, 0x494E464F, false);//magic
        uint16ToBytes(infoChunk, 8, 0x4100, true);
        uint32ToBytes(infoChunk, 0xC, infoChunkHeaderSize - 8, true);
        uint32ToBytes(infoChunk, 0x14, 0xFFFFFFFF, true);
        uint16ToBytes(infoChunk, 0x18, 0x101, true);
        uint32ToBytes(infoChunk, 0x1C, infoChunkHeaderSize + streamInfo.length - 8, true);
        infoChunk = Uint8Cat(infoChunk, streamInfo);
        infoChunk = Uint8Cat(infoChunk, channelInfo);
        var infoChunkPadSize = infoChunk.length % 0x20;
        if(infoChunkPadSize != 0)infoChunk = Uint8Cat(infoChunk, new Uint8Array(0x20 - (infoChunkPadSize % 0x20)));
        uint32ToBytes(infoChunk, 4, infoChunk.length, true);
        var pdatChunk = this.savePdatChunkForMK8DX();
        if (pdatChunk == null)return null;
        var bfstpHeaderSize = 0x40;
        var bfstpHeader = new Uint8Array(bfstpHeaderSize);
        uint32ToBytes(bfstpHeader, 0, 0x46535450, false);//magic
        uint16ToBytes(bfstpHeader, 4, 0xFEFF, true);//bom
        uint16ToBytes(bfstpHeader, 6, bfstpHeaderSize, true);//bfstpHeaderSize = 0x40
        uint32ToBytes(bfstpHeader, 8, 0x10200, false);//version
        uint32ToBytes(bfstpHeader, 0xC, bfstpHeaderSize + infoChunk.length + pdatChunk.length, true);//file size
        uint16ToBytes(bfstpHeader, 0x10, 2, true);//chunk count = 2 (INFO + PDAT)
        uint16ToBytes(bfstpHeader, 0x14, 0x4000, true);//INFO chunk flag
        uint32ToBytes(bfstpHeader, 0x18, bfstpHeaderSize, true);//INFO chunk Offset
        uint32ToBytes(bfstpHeader, 0x1C, infoChunk.length, true);//INFO chunk size
        uint16ToBytes(bfstpHeader, 0x20, 0x4004, true);//PDAT chunk flag
        uint32ToBytes(bfstpHeader, 0x24, bfstpHeaderSize + infoChunk.length, true);//PDAT chunk offset
        uint32ToBytes(bfstpHeader, 0x28, pdatChunk.length, true);//PDAT chunk size
        var dest = Uint8Cat(bfstpHeader, infoChunk, pdatChunk);
        return dest;
    }
}