const PCM_8 = 0;
const PCM_16 = 1;
const PCM_24 = 65534;
const PCM_32 = 65533;
const PCM_64 = 65532;
const BSTM_RSTM_TAG = "RSTM";
const BSTM_CSTM_TAG = "CSTM";
const BSTM_FSTM_TAG = "FSTM";
const BSTM_HEAD_TAG = "HEAD";
const BSTM_INFO_TAG = "INFO";
const BSTM_DATA_TAG = "DATA";
const BSTM_PCM_8 = 0;
const BSTM_PCM_16 = 1;
const BSTM_DSP_ADPCM = 2;
const BSTM_IMA_ADPCM = 3;
const SAMPLES_PER_FRAME = 14;

class DspAdpcmInfo{
    constructor(src, isLE){
        this.coefs = Array(16);
        for (var i = 0; i < 16; i++) this.coefs[i] = bytesToInt16(src, i * 2, isLE);
        this.predScale = bytesToInt16(src, 0x22, isLE);
        this.hist1 = bytesToInt16(src, 0x24, isLE);
        this.hist2 = bytesToInt16(src, 0x26, isLE);
    }
}

function decodeDspAdpcm(src, info){
    var samplesRemaining = info.sampleLength;
    var srcIndex = 0;
    var destIndex = 0;
    var dest = new Int16Array(info.sampleLength);
    var hist1 = info.hist1;
    var hist2 = info.hist2;
    var frameCount = (info.sampleLength + SAMPLES_PER_FRAME - 1) / SAMPLES_PER_FRAME;
    for (var i = 0; i < frameCount; i++)
    {
        var predictor = src[srcIndex] >> 4;
        var scale = 1 << (src[srcIndex] & 0xF);
        srcIndex++;
        var coef1 = info.coefs[predictor * 2];
        var coef2 = info.coefs[predictor * 2 + 1];
        var samplesInFrame = SAMPLES_PER_FRAME;
        if (samplesRemaining < SAMPLES_PER_FRAME) samplesInFrame = samplesRemaining;
        for (var j = 0; j < samplesInFrame; j++)
        {
            var curSample;
            if (j % 2 == 0)
            {
                curSample = src[srcIndex] >> 4;
            }
            else
            {
                curSample = src[srcIndex] & 0xF;
                srcIndex++;
            }
            if (curSample >= 8) curSample -= 16;
            curSample = (((scale * curSample) << 11) + 1024 + (coef1 * hist1 + coef2 * hist2)) >> 11;
            var curRealSample = clamp16(curSample);
            hist2 = hist1;
            hist1 = curRealSample;
            dest[destIndex] = curRealSample;
            destIndex++;
        }
        samplesRemaining -= samplesInFrame;
    }
    return dest;
}

function getMiddleSample(data, index){
    if(index >= data.length - 1)return data[data.length - 1];
    if(index == 0)return data[0];
    var floor = Math.floor(index);
    var downDistance = index - floor;
    var upDistance = 1 - downDistance;
    return Math.round(data[floor] * upDistance + data[floor + 1] * downDistance);
}

function changeSampleRate(data, beforeSampleRate){
    var dest = new Int16Array(Math.round(data.length * ac.sampleRate / beforeSampleRate));
    for(var i = 0;i < dest.length;i++)dest[i] = clamp16(getMiddleSample(data, i / ac.sampleRate * beforeSampleRate));
    return dest;
}

class Sound{
    constructor(src){
        this.valid = false;
        try{
            var isLE;
            var isBcstm = false;
            if (bytesToUint16(src, 4, true) == 0xFFFE)
            {
                isLE = false;
            }
            else if(bytesToUint16(src, 4, true) == 0xFEFF)
            {
                isLE = true;
            }else{
                return;
            }
            if (bytesToString(src, 0, 4) != BSTM_RSTM_TAG)
            {
                if (bytesToString(src, 0, 4) == BSTM_CSTM_TAG || bytesToString(src, 0, 4) == BSTM_FSTM_TAG)
                {
                    isBcstm = true;
                }
                else
                {
                    return;
                }
            }
            var headOffset = 0;
            var dataOffset = 0;
            var dataSize = 0;
            if (isBcstm)
            {
                var chunkCount = bytesToUint16(src, 0x10, isLE);
                var curChunk = 0x14;
                if (chunkCount != 2 && chunkCount != 3) return;
                for (var i = 0; i < chunkCount; i++)
                {
                    var curChunkTag = bytesToUint16(src, curChunk, isLE);
                    switch (curChunkTag)
                    {
                        case 0x4000:
                            headOffset = bytesToUint32(src, curChunk + 4, isLE);
                            break;
                        case 0x4001:
                            break;
                        case 0x4002:
                            dataOffset = bytesToUint32(src, curChunk + 4, isLE);
                            dataSize = bytesToUint32(src, curChunk + 8, isLE);
                            break;
                        default:
                            return;
                    }
                    curChunk += 0xC;
                }
            }
            else
            {
                headOffset = bytesToUint32(src, 0x10, isLE);
                dataOffset = bytesToUint32(src, 0x20, isLE);
                dataSize = bytesToUint32(src, 0x24, isLE);
            }
            if (bytesToString(src, headOffset, 4) != BSTM_HEAD_TAG && bytesToString(src, headOffset, 4) != BSTM_INFO_TAG) return;
            if (bytesToString(src, dataOffset, 4) != BSTM_DATA_TAG) return;
            var head1Offset = headOffset + 8 + bytesToUint32(src, headOffset + 0xC, isLE);
            var brstmFormat = src[head1Offset];
            this.channelCount = src[head1Offset + 2];
            if(isBcstm){
                this.sampleRate = bytesToUint32(src, head1Offset + 4, isLE);
            }else{
                this.sampleRate = bytesToUint16(src, head1Offset + 4, isLE);
            }
            this.sampleLength = bytesToUint32(src, head1Offset + 0xC, isLE);
            this.loopStart = 0;
            if (src[head1Offset + 1] != 0)
            {
                this.isLooped = true;
                this.loopStart = bytesToUint32(src, head1Offset + 8, isLE);
            }
            this.loopEnd = this.sampleLength - 1;
            var blockCount;
            var blockSize;
            var lastBlockSize;
            var lastBlockSizeWithPad;
            var dataPadding;
            if (isBcstm)
            {
                blockCount = bytesToUint32(src, head1Offset + 0x10, isLE);
                blockSize = bytesToUint32(src, head1Offset + 0x14, isLE);
                lastBlockSize = bytesToUint32(src, head1Offset + 0x1C, isLE);
                lastBlockSizeWithPad = bytesToUint32(src, head1Offset + 0x24, isLE);
                dataPadding = bytesToUint32(src, head1Offset + 0x34, isLE);
            }
            else
            {
                blockCount = bytesToUint32(src, head1Offset + 0x14, isLE);
                blockSize = bytesToUint32(src, head1Offset + 0x18, isLE);
                lastBlockSize = bytesToUint32(src, head1Offset + 0x20, isLE);
                lastBlockSizeWithPad = bytesToUint32(src, head1Offset + 0x28, isLE);
                dataPadding = bytesToUint32(src, dataOffset + 8, isLE);
            }
            var infos = Array(this.channelCount);
            var head3Offset = headOffset + 8 + bytesToUint32(src, headOffset + 0x1C, isLE);
            if (brstmFormat == BSTM_DSP_ADPCM)
            {
                for (var i = 0; i < this.channelCount; i++)
                {
                    var channelInfoOffset = 0;
                    if (isBcstm)
                    {
                        channelInfoOffset = head3Offset + bytesToUint32(src, head3Offset + 8 * (i + 1), isLE);
                        channelInfoOffset = channelInfoOffset + bytesToUint32(src, channelInfoOffset + 4, isLE);
                    }
                    else
                    {
                        channelInfoOffset = headOffset + 8 + bytesToUint32(src, head3Offset + 8 * (i + 1), isLE);
                        channelInfoOffset = headOffset + 8 + bytesToUint32(src, channelInfoOffset + 4, isLE);
                    }
                    infos[i] = new DspAdpcmInfo(bytesCut(src, channelInfoOffset, 0x28), isLE);
                    infos[i].sampleLength = this.sampleLength;
                }
            }
            switch (brstmFormat)
            {
                case BSTM_PCM_8:
                    this.format = PCM_8;
                    return;
                    //break;
                    //現時点では対応しない
                case BSTM_PCM_16:
                case BSTM_DSP_ADPCM:
                    this.format = PCM_16;
                    break;
                default:
                    return;

            }
            this.data = new Uint8Array(this.channelCount * this.sampleLength * (this.getBps() / 8));
            var spilitedData = this.spilitBrstmDataByChannel(bytesCut(src, dataOffset + 8 + dataPadding, dataSize - (dataPadding + 8)), blockCount, blockSize, lastBlockSize, lastBlockSizeWithPad, this.channelCount);
            var srcPcm16;
            this.data = new Uint8Array(this.channelCount * this.sampleLength * 2);
            for (var i = 0; i < this.channelCount; i++)
            {
                if (brstmFormat == BSTM_DSP_ADPCM)
                {
                    srcPcm16 = decodeDspAdpcm(spilitedData[i], infos[i]);
                }
                else
                {
                    srcPcm16 = new Int16Array(this.channelCount * this.sampleLength);
                    for (var j = 0; j < this.sampleLength; j++) {
                        srcPcm16[j] = bytesToInt16(spilitedData[i], j * 2, isLE);
                        //int16ToBytes(this.data, (this.channelCount * j + i) * 2, tmpPcm16, true);
                    }
                }
                for(var j = 0; j < this.sampleLength; j++) int16ToBytes(this.data, (this.channelCount * j + i) * 2, srcPcm16[j], true);
            }
            this.valid = true;
            
        }catch{
            return;
        }
    }
    spilitBrstmDataByChannel(data, blockCount, blockSize, lastBlockSize, lastBlockSizeWithPad, channelCount)
        {
            var dest = Array(channelCount);
            for (var i = 0; i < channelCount; i++)
            {
                dest[i] = new Uint8Array((blockCount - 1) * blockSize + lastBlockSize);
                for (var j = 0; j < blockCount; j++)
                {
                    if (j < blockCount - 1)
                    {
                        memcpy(dest[i], j * blockSize, data, blockSize * (channelCount * j + i), blockSize);
                    }
                    else
                    {
                        memcpy(dest[i], j * blockSize, data, blockSize * (channelCount * (blockCount - 1)) + lastBlockSizeWithPad * i, lastBlockSize);
                    }
                }
            }
            return dest;
        }
    getBps(){
        switch (this.format)
            {
                case PCM_8:
                    return 8;
                case PCM_16:
                    return 16;
                case PCM_24:
                    return 24;
                case PCM_32:
                    return 32;
                case PCM_64:
                    return 64;
                case PCM_FLOAT:
                    return 32;
            }
        return 0;
    }
    getSample(channel, sample){
        switch (this.format)
            {
                case PCM_8:
                    return (this.data[sample * this.channelCount + channel] - 128) / 128;
                case PCM_16:
                    return bytesToInt16(this.data, 2 * (sample * this.channelCount + channel), true) / 0x8000;
                case PCM_24:
                    return 24;
                case PCM_32:
                    return bytesToInt32(this.data, 4 * (sample * this.channelCount + channel), true) / 0x80000000;
                case PCM_64:
                    return 64;
                case PCM_FLOAT:
                    return 32;
            }
    }
    getTimeStr(sample){
        var ms = Math.round(1000 * sample / this.sampleRate);
        var s = Math.floor(ms / 1000);
        ms = String(ms % 1000);
        for(var i = 0;i < 3 - ms.length;i++)ms = "0" + ms;
        var min = String(Math.floor(s / 60));
        s = String(s % 60);
        for(var i = 0;i < 2 - s.length;i++)s = "0" + s;
        return min + ":" + s + ":" + ms;
    }
}

class SoundPlayer{
    constructor(sound, fn){
        this.cdDeg = 0;
        this.isPlaying = false;
        this.sound = sound;
        this.valid = true;
        this.offset = 0;
        this.taskOffset = 0;
        if(!sound.valid){
            this.valid = false;
            return;
        }
        if(window.AudioContext){
            this.ac = new window.AudioContext({sampleRate: sound.sampleRate});
        }else{
            this.ac = new window.webkitAudioContext({sampleRate: sound.sampleRate});
        }
        this.track = 0;
        this.trackCount = Math.ceil(sound.channelCount / 2);
        this.buffer = Array(this.trackCount);
        for(var i = 0;i < this.trackCount;i++){
            var isTrackMono = false;
            if((i  + 1) * 2 > this.sound.channelCount)isTrackMono = true;
            this.buffer[i] = this.ac.createBuffer(2, sound.sampleLength, sound.sampleRate);
            for(var j = 0;j < 2;j++){
                var buffering = this.buffer[i].getChannelData(j);
                for(var k = 0;k < sound.sampleLength;k++){
                    if(isTrackMono){
                        buffering[k] = sound.getSample(i * 2,k);
                    }else{
                        buffering[k] = sound.getSample(i * 2 + j,k);
                    }
                }
            }
        }
        cdMsg.style.width = String(cd.clientWidth / 1.414) + "px";
        time.innerHTML = this.getTimeStr(0) + "/" + this.getTimeStr(sound.loopEnd / sound.sampleRate * 1000);
        if(fn.length > 50)fn = fn.substr(0,49) + "...";
        cdMsg.innerHTML = fn;
    }
    getCurSampleIndex(index){
        if(index < this.sound.sampleLength)return index;
        if(!this.sound.isLooped)return 0;
        while(index > this.sound.loopEnd){
            index -= (this.sound.loopEnd -  this.sound.loopStart + 1);
        }
        return index;
    }
    play(){
        if(!this.valid)return;
        this.isPlaying = true;
        playButton.src = "stop.png";
        this.source = this.ac.createBufferSource();
        this.startTime = this.ac.currentTime + 0.017;
        this.source.loop = this.sound.isLooped;
        this.source.loopStart = this.sound.loopStart / this.sound.sampleRate;
        this.source.loopEnd = this.sound.loopEnd / this.sound.sampleRate;
        this.source.buffer = this.buffer[this.track];
        this.source.connect(this.ac.destination);
        this.source.start(this.startTime, this.offset);
        this.taskTimer = setInterval(this.task, 17, this);
    }
    pause(){
        this.offset += (this.ac.currentTime - this.startTime);
        if(this.taskTimer)clearInterval(this.taskTimer);
        while(this.offset >= this.source.loopEnd){
            this.offset -= (this.source.loopEnd - this.source.loopStart);
        }
        console.log(this.offset);
        if(this.isPlaying)this.source.stop();
        this.isPlaying = false;
        playButton.src = "play.png";
        clearAllLevel();
    }
    stop(){
        if(!this.valid)return;
        if(this.taskTimer)clearInterval(this.taskTimer);
        this.offset = 0;
        if(this.isPlaying)this.source.stop();
        this.isPlaying = false;
        this.cdDeg = 0;
        cdMsg.style.transform = "rotate(0deg)";
        playButton.src = "play.png";
        clearAllLevel();
    }
    setOffset(val){
        if(!this.valid)return;
        this.offset = val;
        while(this.offset >= this.source.loopEnd){
            this.offset -= (this.source.loopEnd - this.source.loopStart);
        }
        if(!this.isPlaying){
            time.innerHTML = this.getTimeStr(this.offset * 1000) + "/" + this.getTimeStr(this.source.loopEnd * 1000);
            return;
        }
        this.startTime = this.ac.currentTime + 0.017;
        this.source.stop(this.startTime);
        this.source = this.ac.createBufferSource();
        this.source.loop = this.sound.isLooped;
        this.source.loopStart = this.sound.loopStart / this.sound.sampleRate;
        this.source.loopEnd = this.sound.loopEnd / this.sound.sampleRate;
        this.source.buffer = this.buffer[this.track];
        this.source.connect(this.ac.destination);
        this.source.start(this.startTime, this.offset);
    }
    changeTrack(){
        if(!this.sound.valid)return;
        if(this.trackCount == 1)return;
        if(this.trackCount > this.track + 1){
            this.track++;
        }else{
            this.track = 0;
        }
        if(!this.isPlaying)return;
        this.offset += (this.ac.currentTime + 0.017 - this.startTime);
        this.startTime = this.ac.currentTime + 0.017;
        while(this.offset >= this.source.loopEnd){
            this.offset -= (this.source.loopEnd - this.source.loopStart);
        }
        this.source.stop(this.startTime);
        this.source = this.ac.createBufferSource();
        this.source.loop = this.sound.isLooped;
        this.source.loopStart = this.sound.loopStart / this.sound.sampleRate;
        this.source.loopEnd = this.sound.loopEnd / this.sound.sampleRate;
        this.source.buffer = this.buffer[this.track];
        this.source.connect(this.ac.destination);
        this.source.start(this.startTime, this.offset);
    }
    getTimeStr(ms){
        ms = Math.round(ms);
        var s = Math.floor(ms / 1000);
        ms = String(ms % 1000);
        for(var i = 0;i < 3 - ms.length;i++)ms = "0" + ms;
        var min = String(Math.floor(s / 60));
        s = String(s % 60);
        for(var i = 0;i < 2 - s.length;i++)s = "0" + s;
        return min + ":" + s + ":" + ms;
    }
    task(self){
        var curOffset = self.offset + self.ac.currentTime - self.startTime;
        if(self.ac.currentTime - self.startTime < 0)return;
        if(!self.sound.isLooped && curOffset >= self.sound.loopEnd / self.sound.sampleRate){
            if(self.taskTimer)clearInterval(self.taskTimer);
            self.offset = 0;
            self.isPlaying = false;
            time.innerHTML = self.getTimeStr(self.source.loopEnd * 1000) + "/" + self.getTimeStr(self.source.loopEnd * 1000);
            playButton.src = "play.png";
            clearAllLevel();
            self.cdDeg = 0;
            return;
        }
        while(curOffset >= self.sound.loopEnd / self.sound.sampleRate){
            curOffset -= (self.sound.loopEnd / self.sound.sampleRate - self.sound.loopStart / self.sound.sampleRate);
        }
        var curOffsetSample = Math.round(curOffset * self.sound.sampleRate);
        self.taskOffset += 0.017;
        var curTrackMono = false;
        if((self.track + 1) * 2 > self.sound.channelCount)curTrackMono = true;
        var hzBase = 20;
        for(var i = 0;i < 2;i++){
            for(var j = 0;j < 10; j++){
                var hz = hzBase * Math.pow(2.15443469003, j);
                var curLevelIdx;
                if(i == 0){
                    curLevelIdx = j;
                }else{
                    curLevelIdx = 10 + (9 - j);
                }
                if(curTrackMono){
                    setLevel(curLevelIdx, self.calcLevel(hz, self.track * 2, curOffsetSample));
                }else{
                    setLevel(curLevelIdx, self.calcLevel(hz, self.track * 2 + i, curOffsetSample));
                }
            }
        }
        time.innerHTML = self.getTimeStr(curOffset * 1000) + "/" + self.getTimeStr(self.source.loopEnd * 1000);
        self.cdDeg += 0.6;
        cdMsg.style.transform = "rotate(" + self.cdDeg + "deg)";
    }
    calcLevel(hz, track, curOffsetSample){
        var readSampleCount = (1 / hz) * this.sound.sampleRate;
        if(!this.sound.isLooped && readSampleCount + curOffsetSample > this.sound.loopEnd)readSampleCount = this.sound.loopEnd - curOffsetSample + 1;
        readSampleCount = Math.ceil(readSampleCount);
        if(readSampleCount < 1)readSampleCount = 1;
        var levelBase = 0;
        for(var j = 0;j < readSampleCount;j++){
            var sample = this.sound.getSample(track, this.getCurSampleIndex(curOffsetSample + j));
            levelBase += Math.abs(sample);
        }
        levelBase /= readSampleCount;
        return Math.round(levelBase * 16);
    }
}

var sp = new SoundPlayer(false);