class Sound{
    constructor(soundParams, rawPcm16){
        this.isLooped = false;
        this.data = rawPcm16;
        this.sampleRate = soundParams[0];
        this.sampleLength = soundParams[1];
        this.loopStart = soundParams[3];
        this.loopEnd = soundParams[4];
        this.channelCount = soundParams[5];
        if(soundParams[2]){
            this.isLooped = true;
        }
        this.valid = true;
    }
    getSample(channel, sample){
        return this.data[channel * this.sampleLength + sample] / 0x8000;
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
        this.isMobile = true;
        var ua = navigator.userAgent;
        if (!(ua.indexOf('iPhone') > 0 || ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0 || ua.indexOf('Mobile') > 0 )) {
            this.isMobile = false;
        }
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
        this.createAudioContext();
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
    createAudioContext(){
        if(window.AudioContext){
            this.ac = new window.AudioContext({sampleRate: this.sound.sampleRate});
        }else{
            this.ac = new window.webkitAudioContext({sampleRate: this.sound.sampleRate});
        }
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
        this.createAudioContext();
        this.lastAcTime = -1;
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
        if(self.isMobile && self.lastAcTime == self.ac.currentTime && self.lastAcTime != 0){
            self.pause();
            return;
        }
        self.lastAcTime = self.ac.currentTime; 
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
        for(var i = 0;i < 2;i++){
            var curLevel;
            if(curTrackMono){
                curLevel = self.calcLevel(self.track * 2, curOffsetSample);
            }else{
                curLevel = self.calcLevel(self.track * 2 + i, curOffsetSample);
            }
            for(var j = 0;j < 20; j++){
                var curLevelIdx;
                if(i == 0){
                    curLevelIdx = j;
                }else{
                    curLevelIdx = 20 + (19 - j);
                }
                setLevel(curLevelIdx, curLevel[j]);
            }
        }
        time.innerHTML = self.getTimeStr(curOffset * 1000) + "/" + self.getTimeStr(self.source.loopEnd * 1000);
        self.cdDeg += 0.6;
        cdMsg.style.transform = "rotate(" + self.cdDeg + "deg)";
    }
    calcLevel(channel, curOffsetSample){
        var hz = [20, 220, 420, 620, 820, 1020, 1220, 1420, 1620, 1820, 2020, 2220, 2420, 2620, 2820, 3020, 3220, 3420, 3620, 3820, 4020];
        var dest = Array(10);
        var fftSrc = Array(2048);
        for(var i = 0;i < 1024;i++){
            fftSrc[i << 1] = this.sound.getSample(channel, this.getCurSampleIndex(curOffsetSample + i));
            fftSrc[(i << 1) + 1] = 0;
        }
        DFT.fft(1024, fftSrc);
        var oneHz = this.sound.sampleRate / 1024;
        for(var i = 0;i < 20;i++){
            var startIndex = Math.round(hz[i] / oneHz);
            if(startIndex >= 1024)startIndex = 1023;
            var endIndex = Math.round(hz[i + 1] / oneHz);
            if(endIndex >= 1024)endIndex = 1023;
            dest[i] = 0;
            var indexCount = 0;
            for(var j = startIndex; j < endIndex; j++){
                dest[i] += Math.sqrt(fftSrc[j << 1] * fftSrc[j << 1] + fftSrc[(j << 1) + 1] * fftSrc[(j << 1) + 1]);
                indexCount++;
            }
            dest[i] *= LEVEL_HEIGHT;
            dest[i] /= (128 * indexCount);
            dest[i] = Math.round(dest[i]);
        }
        return dest;
    }
}

var sp = new SoundPlayer(false);