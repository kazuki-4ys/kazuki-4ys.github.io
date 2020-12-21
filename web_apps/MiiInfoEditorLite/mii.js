const MII_FILE_SIZE = 0x4A;
const MII_NAME_LENGTH = 10;
const ID_LENGTH = 0x4;
const UNEDIT1_SIZE = 2;
const UNEDIT2_SIZE = 0x14;
const NINTENDO_API_URL = 'https://studio.mii.nintendo.com/miis/image.png?data=';
const MAKEUP = [0,1,6,9,0,0,0,0,0,10,0,0];
const WRINKLES = [0,0,0,0,5,2,3,7,8,0,9,11];
var editMii = {
	//0x0
	invalid:false,
    isGirl:false,
    month:0,
	day:0,
    favColor:0,
	isFavorite:false,
	//0x2
	name:'',
	//0x16
    height:0x40,
	//0x17
	weight:0x40,
	//0x18
    miiID:[0x86,0xb4,0x03,0xf0],
	//0x1C
    consoleID:[0xec,0xff,0x82,0xd2],
	//0x20
	unEdit1:[0x00,0x00],
	mingleOff:true,
	//0x22
　　unEdit2:[0x42,0x40,0x31,0xbd,0x28,0xa2,0x08,0x8c,0x08,0x40,0x14,0x49,0xb8,0x8d,0x00,0x8a,0x00,0x8a,0x25,0x04,0x00],
	//0x36
	creatorName:'',
	studio:new Uint8Array([0x08,0x00,0x40,0x03,0x08,0x04,0x04,0x02,0x02,0x0c,0x03,0x01,0x06,0x04,0x06,0x02,0x0a,0x00,0x00,0x00,0x00,0x00,0x00,0x08,0x04,0x00,0x0a,0x01,0x00,0x21,0x40,0x04,0x00,0x02,0x14,0x03,0x13,0x04,0x17,0x0d,0x04,0x00,0x0a,0x04,0x01,0x09]),
	previewData:'000f165d6574777a7f848f9399a6a9b6bbb8bfc6cdd4dbe2f1fc0310181f450c0f161b161c1619151f22292a353b39'
};

function byteToString(int){
    var str = int.toString(16);
    if(str.length < 2)str = '0' + str;
    return str;
}

function buftoUint16(data,addr){
    return (data[addr] << 8) + data[addr + 1];
}

function encodeStudio(studio){
    var n = 0;
    var eo;
    var dest= byteToString(n);
    for(var i = 0;i < studio.length;i++){
        eo = (7 + (studio[i] ^ n)) & 0xFF;
        n = eo;
        dest += byteToString(eo);
    }
    return dest;
}

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
		tmpU16 = buf[i * 2] * 256 + buf[i * 2 + 1];
		if(tmpU16 === 0)break;
		string += String.fromCharCode(tmpU16);
	}
	return string;
}

function miiFileRead(buf){
	console.log(buf);
	editMii.invalid = getBoolean(buf[0] >>> 7);
	editMii.studio[0x16] = (buf[0] >>> 6) & 1;
	editMii.isGirl = getBoolean(editMii.studio[0x16]);
	editMii.month = (buf[0] >>> 2) &　0xf;
	editMii.day = ((buf[0] & 3) << 3) + (buf[1] >>> 5);
	editMii.favColor = (buf[1] >>> 1) & 0xf;
	editMii.studio[0x15] = editMii.favColor;
	editMii.isFavorite = getBoolean(buf[1] & 1);
	var i;
	var stringBuf = [MII_NAME_LENGTH * 2];
	for(i = 0;i < MII_NAME_LENGTH;i++){
		stringBuf[i * 2] = buf[i * 2 + 0x2];
		stringBuf[i * 2 + 1] = buf[i * 2 + 0x2 + 1];
	}
	editMii.name = bufToUtf16String(stringBuf);
	editMii.height = buf[0x16];
	editMii.studio[0x1E] = editMii.height;
	editMii.weight = buf[0x17];
	editMii.studio[2] = editMii.weight;
	for(i = 0;i < ID_LENGTH;i++){
		editMii.miiID[i] = buf[0x18 + i];
		editMii.consoleID[i] = buf[0x1C + i];
	}
	editMii.unEdit1[0] = buf[0x20];
	editMii.mingleOff = getBoolean((buf[0x21] >>> 2) & 1);
	editMii.unEdit1[1] = buf[0x21] & 0xfb;
	for(i = 0;i < UNEDIT2_SIZE;i++){
        editMii.unEdit2[i] = buf[0x22 + i];
	}
	for(i = 0;i < MII_NAME_LENGTH;i++){
		stringBuf[i * 2] = buf[i * 2 + 0x36];
		stringBuf[i * 2 + 1] = buf[i * 2 + 0x36 + 1];
	}
	editMii.creatorName = bufToUtf16String(stringBuf);
	var faceShape = buf[0x20] >>> 5;
	var skinColor = (buf[0x20] >>> 2) & 7;
	var tmpU16 = buftoUint16(buf,0x20);
	var facialFeature = (tmpU16 >>> 6) & 0xF;
	editMii.studio[0x13] = faceShape;
	editMii.studio[0x11] = skinColor;
	editMii.studio[0x12] = MAKEUP[facialFeature];
	editMii.studio[0x14] = WRINKLES[facialFeature];
	var hairType = buf[0x22] >>> 1;
	tmpU16 = buftoUint16(buf,0x22);
	var hairColor = (tmpU16 >>> 6) & 7;
	var hairPart = (buf[0x23] >>> 5) & 1;
	editMii.studio[0x1D] = hairType;
	if(!hairColor)hairColor = 8;
	editMii.studio[0x1B] = hairColor;
	editMii.studio[0x1C] = hairPart;
	var eyebrowType = buf[0x24] >>> 3;
	tmpU16 = buftoUint16(buf,0x24);
	var eyebrowRotation = (tmpU16 >>> 6) & 0xF;
	var eyebrowColor = buf[0x26] >>> 5;
	var eyebrowSize = (buf[0x26] >>> 1) & 0xF;
	tmpU16 = buftoUint16(buf,0x26);
	var eyebrowVertPos = (tmpU16 >>> 4) & 0x1F;
	var eyebrowHorizSpacing = buf[0x27] & 0xF;
	editMii.studio[0xE] = eyebrowType;
	editMii.studio[0xC] = eyebrowRotation;
	if(!eyebrowColor)eyebrowColor = 8;
	editMii.studio[0xB] = eyebrowColor;
	editMii.studio[0xD] = eyebrowSize;
	editMii.studio[0x10] = eyebrowVertPos;
	editMii.studio[0xF] = eyebrowHorizSpacing;
	var eyeType = buf[0x28] >>> 2;
	var eyeRotation = buf[0x29] >>> 5;
	var eyeVertPos = buf[0x29] & 0x1F;
	var eyeColor = buf[0x2A] >>> 5;
	var eyeSize = (buf[0x2A] >>> 1) & 7;
	tmpU16 = buftoUint16(buf,0x2A);
	var eyeHorizSpacing = (tmpU16 >>> 5) & 0xF;
	editMii.studio[7] = eyeType;
	editMii.studio[5] = eyeRotation;
	editMii.studio[9] = eyeVertPos;
	editMii.studio[4] = eyeColor + 8;
	editMii.studio[6] = eyeSize;
	editMii.studio[8] = eyeHorizSpacing;
	var noseType = buf[0x2C] >>> 4;
	var noseSize = buf[0x2C] & 0xF;
	var noseVertPos = buf[0x2D] >>> 3;
	editMii.studio[0x2C] = noseType;
	editMii.studio[0x2B] = noseSize;
	editMii.studio[0x2D] = noseVertPos;
	var lipType = buf[0x2E] >>> 3;
	var lipColor = (buf[0x2E] >>> 1) & 3;
	tmpU16 = buftoUint16(buf,0x2E);
	var lipSize = (tmpU16 >>> 5) & 0xF;
	var lipVertPos = buf[0x2F] & 0x1F;
	editMii.studio[0x26] = lipType;
	if(lipColor < 4){
		lipColor += 19;
	}else{
		lipColor = 0;
	}
	editMii.studio[0x24] = lipColor;
	editMii.studio[0x25] = lipSize;
	editMii.studio[0x27] = lipVertPos;
	var glassesType = buf[0x30] >>> 4;
	var glassesColor = (buf[0x30] >>> 1) & 7;
	var glassesSize = buf[0x31] >>> 5;
	var glassesVertPos = buf[0x31] & 0x1F;
	editMii.studio[0x19] = glassesType;
	if(!glassesColor){
		glassesColor = 8;
	}else if(glassesColor < 6){
		glassesColor += 13;
	}else{
		glassesColor = 0;
	}
	editMii.studio[0x17] = glassesColor;
	editMii.studio[0x18] = glassesSize;
	editMii.studio[0x1A] = glassesVertPos;
	var mustacheType = buf[0x32] >>> 6;
	var beardType = (buf[0x32] >>> 4) & 3;
	var facialHairColor = (buf[0x32] >>> 1) & 7;
	tmpU16 = buftoUint16(buf,0x32);
	var mustacheSize = (tmpU16 >>> 5) & 0xF;
	var mustacheVertPos = buf[0x33] & 0x1F;
	editMii.studio[0x29] = mustacheType;
	editMii.studio[1] = beardType;
	if(!facialHairColor)facialHairColor = 8;
	editMii.studio[0] = facialHairColor;
	editMii.studio[0x28] = mustacheSize;
	editMii.studio[0x2A] = mustacheVertPos;
	var moleOn = buf[0x34] >>> 7;
	var moleSize = (buf[0x34] >>> 3) & 0xF;
	tmpU16 = buftoUint16(buf,0x34);
	var moleVertpos = (tmpU16 >>> 6) & 0x1F;
	var moleHoriznPos = (buf[0x35] >>> 1) & 0x1F;
	editMii.previewData = encodeStudio(editMii.studio);
	editMii.studio[0x20] = moleOn;
	editMii.studio[0x1F] = moleSize;
	editMii.studio[0x22] = moleVertpos;
	editMii.studio[0x21] = moleHoriznPos;
	updateMiiPreview();
	setUI();
}

function miiFileWrite(){
	var i;
	var buf = new Uint8Array(MII_FILE_SIZE);
	buf[0] = (getInt(editMii.invalid) << 7) + (getInt(editMii.isGirl) << 6) + (editMii.day >>> 3) + (editMii.month << 2);
	buf[1] = ((editMii.day & 7) << 5) + (editMii.favColor << 1) + getInt(editMii.isFavorite);
	for(i = 0;i < MII_NAME_LENGTH;i++){
        if(editMii.name.length <= i){
			buf[2 + i * 2] = 0;
			buf[2 + i * 2 + 1] = 0;
		}else{
			buf[2 + i * 2] = Math.floor(editMii.name.charCodeAt(i) / 256);
			buf[2 + i * 2 + 1] = editMii.name.charCodeAt(i) % 256;
		}
		if(editMii.creatorName.length <= i){
			buf[0x36 + i * 2] = 0;
			buf[0x36 + i * 2 + 1] = 0;
		}else{
			buf[0x36 + i * 2] = Math.floor(editMii.creatorName.charCodeAt(i) / 256);
			buf[0x36 + i * 2 + 1] = editMii.creatorName.charCodeAt(i) % 256;
		}
	}
	buf[0x16] = editMii.height;
	buf[0x17] = editMii.weight;
	for(i = 0;i < ID_LENGTH;i++){
		buf[0x18 + i] = editMii.miiID[i];
		buf[0x1C + i] = editMii.consoleID[i];
	}
	buf[0x20] = editMii.unEdit1[0];
	buf[0x21] = editMii.unEdit1[1] + (getInt(editMii.mingleOff) << 2);
	for(i = 0;i < UNEDIT2_SIZE;i++){
        buf[0x22 + i] = editMii.unEdit2[i];
	}
	return buf;
}