const MII_FILE_SIZE = 0x5C;
const MII_NAME_LENGTH = 10;
const CONSOLE_ID_LENGTH = 0x8;
const MII_ID_LENGTH = 0x4;
const MAC_ADDR_LENGTH = 0x6;
const UNEDIT_SIZE = 0x18;
var editMii = {
	//0x1
	allowCopying:false,
	profanityFlag:false,
	regionLock:0,
	characterSet:0,
	//0x2
	pageIndex:0,
	slotIndex:0,
	//0x3
	version:3,
	//0x4
	consoleID:[0,0,0,0,0,0,0,0],
	//0xC
	miiID:[0x90,0,0,0],
	//0x10
	creatorMAC:[0x7c,0xbb,0x8a,0,0,0],
	//0x18
	isGirl:false,
    month:0,
	day:0,
    favColor:0,
	isFavorite:false,
	//0x1a
	name:'no name',
	//0x2e
    height:0x40,
	//0x2f
	weight:0x40,
	//0x30
	sharing:true,
　　unEdit:[0,0,0x21,1,2,0x68,0x44,0x18,0x26,0x34,0x46,0x14,0x81,0x12,0x17,0x68,0xd,0,0,0x29,0,0x52,0x48,0x50],
	//0x48
	creatorName:''
};

function getBoolean(int){
	if(int === 1)return true;
	return false;
}

function getInt(boolean){
	if(boolean === true)return 1;
	return 0;
}

function bufToUtf16String(buf){
	var tmpU16,i,string;
	string = '';
	for(i = 0;i < MII_NAME_LENGTH;i++){
		tmpU16 = buf[i * 2 + 1] * 256 + buf[i * 2];
		if(tmpU16 === 0)break;
		string += String.fromCharCode(tmpU16);
	}
	return string;
}

function miiFileRead(buf){
	console.log(buf);
	editMii.allowCopying = getBoolean(buf[0x1] & 1);
	editMii.profanityFlag = getBoolean((buf[0x1]  >>> 1) & 1);
	editMii.regionLock = (buf[0x1]  >>> 2) & 3;
	editMii.characterSet = (buf[0x1]  >>> 4) & 3;
	editMii.pageIndex = buf[0x2] & 0xf;
	editMii.slotIndex = (buf[0x2] >>> 4) & 0xf;
    editMii.version = (buf[0x3] >>> 4) & 0x7;
	for(i = 0;i < CONSOLE_ID_LENGTH;i++){
		editMii.consoleID[i] = buf[0x4 + i];
	}
	for(i = 0;i < MII_ID_LENGTH;i++){
		editMii.miiID[i] = buf[0xc + i];
	}
	for(i = 0;i < MAC_ADDR_LENGTH;i++){
		editMii.creatorMAC[i] = buf[0x10 + i];
	}
	editMii.isGirl = getBoolean(buf[0x18] & 1);
	editMii.month = (buf[0x18] >>> 1) &　0xf;
	editMii.day = ((buf[0x19] & 3) << 3) + (buf[0x18] >>> 5);
	editMii.favColor = (buf[0x19] >>> 2) & 0xf;
	editMii.isFavorite = getBoolean((buf[0x19] >>> 6) & 1);
	var i;
	var stringBuf = [MII_NAME_LENGTH * 2];
	for(i = 0;i < MII_NAME_LENGTH * 2;i++){
	    stringBuf[i] = buf[0x1a + i];
	}
	editMii.name = bufToUtf16String(stringBuf);
	editMii.height = buf[0x2e];
	editMii.weight = buf[0x2f];
	for(i = 0;i < UNEDIT_SIZE;i++){
        editMii.unEdit[i] = buf[0x30 + i];
	}
	editMii.sharing = !(getBoolean(editMii.unEdit[0] & 1));
	editMii.unEdit[0] &= 0xfe;
	for(i = 0;i < MII_NAME_LENGTH * 2;i++){
		stringBuf[i] = buf[i + 0x48];
	}
	editMii.creatorName = bufToUtf16String(stringBuf);
	setUI();
}

function miiFileWrite(){
	var i;
	var buf = new Uint8Array(MII_FILE_SIZE);
	buf[0] = 3;
	buf[0x16] = 0;
	buf[0x17] = 0;
	buf[1] = getInt(editMii.allowCopying) + (getInt(editMii.profanityFlag) << 1) + (editMii.regionLock << 2) + (editMii.characterSet << 4);
	buf[2] = editMii.pageIndex + (editMii.slotIndex << 4);
	buf[3] = editMii.version << 4;
	for(i = 0;i < CONSOLE_ID_LENGTH;i++){
		buf[4 + i] = editMii.consoleID[i];
	}
	for(i = 0;i < MII_ID_LENGTH;i++){
		buf[0xc + i] = editMii.miiID[i];
	}
	for(i = 0;i < MAC_ADDR_LENGTH;i++){
		buf[0x10 + i] = editMii.creatorMAC[i];
	}
	buf[0x18] = getInt(editMii.isGirl) + (editMii.month << 1) + ((editMii.day & 7) << 5);
	buf[0x19] = (editMii.day >>> 3) + (editMii.favColor << 2) + (getInt(editMii.isFavorite) << 6);
	for(i = 0;i < MII_NAME_LENGTH;i++){
        if(editMii.name.length <= i){
			buf[0x1a + i * 2] = 0;
			buf[0x1a + i * 2 + 1] = 0;
		}else{
			buf[0x1a + i * 2] = editMii.name.charCodeAt(i) & 0xff;
			buf[0x1a + i * 2 + 1] = (editMii.name.charCodeAt(i) >>> 8) & 0xff;
		}
		if(editMii.creatorName.length <= i){
			buf[0x48 + i * 2] = 0;
			buf[0x48 + i * 2 + 1] = 0;
		}else{
			buf[0x48 + i * 2] = editMii.creatorName.charCodeAt(i) & 0xff;
			buf[0x48 + i * 2 + 1] = (editMii.creatorName.charCodeAt(i) >>> 8) & 0xff;
		}
	}
	buf[0x2e] = editMii.height;
	buf[0x2f] = editMii.weight;
	for(i = 0;i < UNEDIT_SIZE;i++){
		buf[0x30 + i] = editMii.unEdit[i];
	}
	buf[0x30] += getInt(!(editMii.sharing));
	return buf;
}