const RKSYS_SIZE = 0x2BC000;
const RKSYS_MAGIC = "RKSD0006";
const CHECKSUM_ADDR = 0x27FFC;
const MAX_PLAYER_NUM = 4;
const RKPD_SIZE = 0x8CC0;
const RKPD_MAGIC = "RKPD";
const TT_ADDR = 0x28000;
const TT_SIZE = 0xA5000;
const RKGD_MAX_SIZE = 0x2800;
const RKGD_MAGIC = "RKGD";
const MAX_FRIEND_NUM = 30;
const FRIEND_DATA_OFFSET = 0x56D3;
const FRIEND_DATA_SIZE = 0x1C0;
const MII_SIZE = 0x4A;

function checkMiiData(data){
    for(var i = 0;i < MII_SIZE;i++){
        if(data[i] !== 0)return true;
    }
    return false;
}

class friendData{
    constructor(data,addr){
        this.rawData = data;
        this.addr = addr;
        if(checkMiiData(this.getMii())){
            this.valid = true;
        }else{
            this.valid = false;
        }
    }
    getName(){
        return bufToUTF16String(this.rawData,this.addr + 0x19,10);
    }
    getMii(){
        return Uint8Cut(this.rawData,this.addr + 0x17,MII_SIZE);
    }
    getWins(){
        return buftoUint16(this.rawData,this.addr + 0x11);
    }
    setWins(wins){
        Uint16toBuf(this.rawData,this.addr + 0x11,wins);
    }
    getLosses(){
        return buftoUint16(this.rawData,this.addr + 0xF);
    }
    setLosses(loses){
        Uint16toBuf(this.rawData,this.addr + 0xF,loses);
    }
}

class playerData{
    constructor(data,ad1,ad2){
        if(bufToAsciiString(data,ad1,RKPD_MAGIC.length) !== RKPD_MAGIC){
            this.valid = false;
            return;
        }
        this.valid = true;
        this.rawData = data;
        this.RKPDAddr = ad1;
        this.RKGDAddr = ad2;
        this.friends = [];
        this.friends.length = MAX_FRIEND_NUM;
        this.ghostExist = [];
        this.ghostExist.length = 32;
        for(var i = 0;i < MAX_FRIEND_NUM;i++){
            this.friends[i] = (new friendData(this.rawData,this.RKPDAddr + FRIEND_DATA_OFFSET + i * FRIEND_DATA_SIZE));
        }
        for(var i = 0;i < this.ghostExist.length;i++){
            if(bufToAsciiString(this.rawData,this.RKGDAddr + i * RKGD_MAX_SIZE,RKGD_MAGIC.length) === RKGD_MAGIC){
                this.ghostExist[i] = true;
            }else{
                this.ghostExist[i] = false;
            }
        }
    }
    getName(){
        return bufToUTF16String(this.rawData,this.RKPDAddr + 0x14,10);
    }
    unlockAll(){
        this.rawData[this.RKPDAddr + 0x30] = 0xFF;
        this.rawData[this.RKPDAddr + 0x31] = 0xFF;
        this.rawData[this.RKPDAddr + 0x32] = 0xFF;
        this.rawData[this.RKPDAddr + 0x33] = 0xFF;
        this.rawData[this.RKPDAddr + 0x34] = 3;
        this.rawData[this.RKPDAddr + 0x35] = 0x1F;
        this.rawData[this.RKPDAddr + 0x36] = 0xFF;
        this.rawData[this.RKPDAddr + 0x37] = 0xFC;
    }
    getVR(){
        return buftoUint16(this.rawData,this.RKPDAddr + 0xB0);
    }
    setVR(vr){
        Uint16toBuf(this.rawData,this.RKPDAddr + 0xB0,vr);
    }
    getBR(){
        return buftoUint16(this.rawData,this.RKPDAddr + 0xB2);
    }
    setBR(br){
        Uint16toBuf(this.rawData,this.RKPDAddr + 0xB2,br);
    }
    getWfcVSWins(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0x98);
    }
    setWfcVSWins(wins){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0x98,wins);
    }
    getWfcBTWins(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xA0);
    }
    setWfcBTWins(wins){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xA0,wins);
    }
    getWfcVSLosses(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0x9C);
    }
    setWfcVSLosses(wins){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0x9C,wins);
    }
    getWfcBTLosses(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xA4);
    }
    setWfcBTLosses(wins){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xA4,wins);
    }
    getTotalVSCount(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xB4);
    }
    setTotalVSCount(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xB4,val);
    }
    getTotalBTCount(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xB8);
    }
    setTotalBTCount(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xB8,val);
    }
    getItemHitsDelivered(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xD0);
    }
    setItemHitsDelivered(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xD0,val);
    }
    getItemHitsReceived(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xD4);
    }
    setItemHitsReceived(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xD4,val);
    }
    getTricks(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xD8);
    }
    setTricks(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xD8,val);
    }
    get1stPlaceAppearances(){
        return buftoUint32(this.rawData,this.RKPDAddr + 0xDC);
    }
    set1stPlaceAppearances(val){
        Uint32toBuf(this.rawData,this.RKPDAddr + 0xDC,val);
    }
    getTournamentsPlayed(){
        return buftoUint16(this.rawData,this.RKPDAddr + 0xE8);
    }
    setTournamentsPlayed(val){
        Uint16toBuf(this.rawData,this.RKPDAddr + 0xE8,val);
    }
    getTotalDistanceTraveled(){
        return Math.round(bufToFloat32(this.rawData,this.RKPDAddr + 0xC4));
    }
    setTotalDistanceTraveled(val){
        Float32ToBuf(this.rawData,this.RKPDAddr + 0xC4,val);
    }
    getRKGD(id){
        var oneRkgdAddr = this.RKGDAddr + id * RKGD_MAX_SIZE;
        //TODO:RKGのサイズを取得してその分のデータだけを返すようにする。
        if(true){
            return Uint8Cut(this.rawData,oneRkgdAddr,RKGD_MAX_SIZE);
        }
    }
    setRKGD(data,id){
        if(bufToAsciiString(data,0,RKGD_MAGIC.length) !== RKGD_MAGIC || data.length > RKGD_MAX_SIZE){
            return;
        }
        data[7] = getSlotId[id];
        Uint32toBuf(data,data.length - 4,getCRC32(data,0,data.length - 4));
        memset(this.rawData,this.RKGDAddr + id * RKGD_MAX_SIZE,RKGD_MAX_SIZE,0);
        memcpy(this.rawData,this.RKGDAddr + id * RKGD_MAX_SIZE,data,0,data.length);
    }
}

class RKSD{
    constructor(data){
        if(data.length == RKSYS_SIZE){
            if(bufToAsciiString(data,0,RKSYS_MAGIC.length) === RKSYS_MAGIC){
                this.rawData = data;
                this.valid = true;
                this.players = [];
                this.players.length = MAX_PLAYER_NUM;
                for(var i = 0;i < MAX_PLAYER_NUM;i++){
                    var tmpPd = new playerData(this.rawData,RKSYS_MAGIC.length + i * RKPD_SIZE,TT_ADDR + i * TT_SIZE);
                    this.players[i] = tmpPd;
                }
            }else{
                this.valid = false;
            }
        }else{
            this.valid = false;
        }
    }
    getRegion(){
        return this.rawData[0x26B0A];
    }
    setRegion(reg){
        this.rawData[0x26B0A] = reg;
    }
    save(){
        Uint32toBuf(this.rawData,CHECKSUM_ADDR,getCRC32(this.rawData,0,CHECKSUM_ADDR));
        return this.rawData;
    }
}