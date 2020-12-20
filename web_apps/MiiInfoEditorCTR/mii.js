const MII_FILE_SIZE = 0x5C;
const MII_NAME_LENGTH = 10;
const CONSOLE_ID_LENGTH = 0x8;
const MII_ID_LENGTH = 0x4;
const MAC_ADDR_LENGTH = 0x6;
const UNEDIT_SIZE = 0x18;
const NINTENDO_API_URL = 'https://studio.mii.nintendo.com/miis/image.png?data=';
const MAKEUP = [0,1,6,9,0,0,0,0,0,10,0,0];
const WRINKLES = [0,0,0,0,5,2,3,7,8,0,9,11];
var rawData = null;
var qrBase64 = null;
var editMii = {
	//0x0
	unknown:3,
	//0x1
	allowCopying:true,
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
	miiID:[0x90 + Math.floor(Math.random() * 16),Math.floor(Math.random() * 256),Math.floor(Math.random() * 256),Math.floor(Math.random() * 256)],
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
	faceShape:0,
	skinColor:0,
	//0x31
	wrinkles:0,
	makeup:0,
	//0x32
	hairStyle:33,
	//0x33
	hairColor:1,
	flipHair:0,
	//0x34
	eyeStyle:2,
	eyeColor:0,
	eyeScale:4,
	eyeYscale:3,
	eyeRotation:4,
	eyeXspacing:2,
	eyeYposition:12,
	//0x38
	eyebrowStyle:6,
	eyebrowColor:1,
	eyebrowScale:4,
	eyebrowYscale:3,
	eyebrowRotation:6,
	eyebrowXspacing:2,
	eyebrowYposition:10,
	//0x3C
	noseStyle:1,
	noseScale:4,
	noseYposition:9,
	//0x3E
	mouseStyle:23,
	mouseColor:0,
	mouseScale:4,
	mouseYscale:3,
	//0x40
	mouseYposition:13,
	mustacheStyle:0,
	//0x42
	beardStyle:0,
	beardColor:0,
	mustacheScale:4,
	mustacheYposition:10,
	//0x44
	glassesStyle:0,
	glassesColor:0,
	glassesScale:4,
	glassesYposition:10,
	//0x46
	enableMole:0,
	moleScale:4,
	moleXposition:2,
	moleYposition:20,
	studio:[0x08,0x00,0x40,0x03,0x08,0x04,0x04,0x02,0x02,0x0c,0x03,0x01,0x06,0x04,0x06,0x02,0x0a,0x00,0x00,0x00,0x00,0x00,0x00,0x08,0x04,0x00,0x0a,0x01,0x00,0x21,0x40,0x04,0x00,0x02,0x14,0x03,0x13,0x04,0x17,0x0d,0x04,0x00,0x0a,0x04,0x01,0x09],
	previewData:'000f165d6574777a7f848f9399a6a9b6bbb8bfc6cdd4dbe2f1fc0310181f450c0f161b161c1619151f22292a353b39',
	//0x48
	creatorName:''
};

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

function miiFileRead(buf){
	rawData = buf;
	qrBase64 = null;
	editMii.unknown = buf[0];
	editMii.allowCopying = getBoolean(buf[0x1] & 1);
	editMii.profanityFlag = getBoolean((buf[0x1]  >>> 1) & 1);
	editMii.regionLock = (buf[0x1]  >>> 2) & 3;
	editMii.characterSet = (buf[0x1]  >>> 4) & 3;
	editMii.pageIndex = buf[0x2] & 0xf;
	editMii.slotIndex = (buf[0x2] >>> 4) & 0xf;
    editMii.version = (buf[0x3] >>> 4) & 0x7;
	for(var i = 0;i < CONSOLE_ID_LENGTH;i++){
		editMii.consoleID[i] = buf[0x4 + i];
	}
	for(var i = 0;i < MII_ID_LENGTH;i++){
		editMii.miiID[i] = buf[0xc + i];
	}
	for(var i = 0;i < MAC_ADDR_LENGTH;i++){
		editMii.creatorMAC[i] = buf[0x10 + i];
	}
	editMii.isGirl = getBoolean(buf[0x18] & 1);
	editMii.month = (buf[0x18] >>> 1) &　0xf;
	editMii.day = ((buf[0x19] & 3) << 3) + (buf[0x18] >>> 5);
	editMii.favColor = (buf[0x19] >>> 2) & 0xf;
	editMii.isFavorite = getBoolean((buf[0x19] >>> 6) & 1);
	editMii.name = bufToUTF16String(buf,0x1A,MII_NAME_LENGTH,true);
	editMii.height = buf[0x2e];
	editMii.weight = buf[0x2f];
	editMii.sharing = !(getBoolean(buf[0x30] & 1));
	editMii.faceShape = (buf[0x30] >>> 1) & 0xF;
	editMii.skinColor = buf[0x30] >>> 5;
	editMii.wrinkles = buf[0x31] & 0xF;
	editMii.makeup = buf[0x31] >>> 4;
	editMii.hairStyle = buf[0x32];
	editMii.hairColor = buf[0x33] & 7;
	editMii.flipHair = (buf[0x33] >>> 3) & 1;
	var tmpU32 = bufToUint32(buf,0x34,true);
	editMii.eyeStyle = tmpU32 & 0x3F;
	editMii.eyeColor = (tmpU32 >>> 6) & 7;
	editMii.eyeScale = (tmpU32 >>> 9) & 0xF;
	editMii.eyeYscale = (tmpU32 >>> 13) & 7;
	editMii.eyeRotation = (tmpU32 >>> 16) & 0x1F;
	editMii.eyeXspacing = (tmpU32 >>> 21) & 0xF;
	editMii.eyeYposition = (tmpU32 >>> 25) & 0x1F;
	tmpU32 = bufToUint32(buf,0x38,true);
	editMii.eyebrowStyle = tmpU32 & 0x1F;
	editMii.eyebrowColor = (tmpU32 >>> 5) & 7;
	editMii.eyebrowScale = (tmpU32 >>> 8) & 0xF;
	editMii.eyebrowYscale = (tmpU32 >>> 12) & 7;
	editMii.eyebrowRotation = (tmpU32 >>> 16) & 0xF;
	editMii.eyebrowXspacing = (tmpU32 >>> 21) & 0xF;
	editMii.eyebrowYposition = (tmpU32 >>> 25) & 0x1F;
	var tmpU16 = bufToUint16(buf,0x3C,true);
	editMii.noseStyle = tmpU16 & 0x1F;
	editMii.noseScale = (tmpU16 >>> 5) & 0xF;
	editMii.noseYposition = (tmpU16 >>> 9) & 0x1F;
	tmpU16 = bufToUint16(buf,0x3E,true);
	editMii.mouseStyle = tmpU16 & 0x3F;
	editMii.mouseColor = (tmpU16 >>> 6) & 7;
	editMii.mouseScale = (tmpU16 >>> 9) & 0xF;
	editMii.mouseYscale = (tmpU16 >>> 13) & 7;
	tmpU16 = bufToUint16(buf,0x40,true);
	editMii.mouseYposition = tmpU16 & 0x1F;
	editMii.mustacheStyle = (tmpU16 >>> 5) & 7;
	tmpU16 = bufToUint16(buf,0x42,true);
	editMii.beardStyle = tmpU16 & 7;
	editMii.beardColor = (tmpU16 >>> 3) & 7;
	editMii.mustacheScale = (tmpU16 >>> 6) & 0xF;
	editMii.mustacheYposition = (tmpU16 >>> 10) & 0x1F;
	tmpU16 = bufToUint16(buf,0x44,true);
	editMii.glassesStyle = tmpU16 & 0xF;
	editMii.glassesColor = (tmpU16 >>> 4) & 7;
	editMii.glassesScale = (tmpU16 >>> 7) & 0xF;
	editMii.glassesYposition = (tmpU16 >>> 11) & 0x1F;
	tmpU16 = bufToUint16(buf,0x46,true);
	editMii.enableMole = tmpU16 & 1;
	editMii.moleScale = (tmpU16 >>> 1) & 0xF;
	editMii.moleXposition = (tmpU16 >>> 5) & 0x1F;
	editMii.moleYposition = (tmpU16 >>> 10) & 0x1F;
	editMii.creatorName = bufToUTF16String(buf,0x48,MII_NAME_LENGTH,true);

	editMii.studio[0x16] = getInt(editMii.isGirl);
	editMii.studio[0x15] = editMii.favColor;
	editMii.studio[0x1E] = editMii.height;
	editMii.studio[2] = editMii.weight;
	editMii.studio[0x13] = editMii.faceShape;
	editMii.studio[0x11] = editMii.skinColor;
	editMii.studio[0x14] = editMii.wrinkles;
	editMii.studio[0x12] = editMii.makeup;
	editMii.studio[0x1D] = editMii.hairStyle;
	editMii.studio[0x1B] = editMii.hairColor;
	if(!editMii.studio[0x1B])editMii.studio[0x1B] = 8;
	editMii.studio[0x1C] = editMii.flipHair;
	editMii.studio[7] = editMii.eyeStyle;
	editMii.studio[4] = editMii.eyeColor + 8;
	editMii.studio[6] = editMii.eyeScale;
	editMii.studio[3] = editMii.eyeYscale;
	editMii.studio[5] = editMii.eyeRotation;
	editMii.studio[8] = editMii.eyeXspacing;
	editMii.studio[9] = editMii.eyeYposition;
	editMii.studio[0xE] = editMii.eyebrowStyle;
	editMii.studio[0xB] = editMii.eyebrowColor;
	if(!editMii.studio[0xB])editMii.studio[0xB] = 8;
	editMii.studio[0xD] = editMii.eyebrowScale;
	editMii.studio[0xA] = editMii.eyebrowYscale;
	editMii.studio[0xC] = editMii.eyebrowRotation;
	editMii.studio[0xF] = editMii.eyebrowXspacing;
	editMii.studio[0x10] = editMii.eyebrowYposition;
	editMii.studio[0x2C] = editMii.noseStyle;
	editMii.studio[0x2B] = editMii.noseScale;
	editMii.studio[0x2D] = editMii.noseYposition;
	editMii.studio[0x26] = editMii.mouseStyle;
	editMii.studio[0x24] = editMii.mouseColor;
	if(editMii.studio[0x24] < 4){
		editMii.studio[0x24] += 19;
	}else{
		editMii.studio[0x24] = 0;
	}
	editMii.studio[0x25] = editMii.mouseScale;
	editMii.studio[0x23] = editMii.mouseYscale;
	editMii.studio[0x27] = editMii.mouseYposition;
	editMii.studio[0x29] = editMii.mustacheStyle;
	editMii.studio[1] = editMii.beardStyle;
	editMii.studio[0] = editMii.beardColor;
	if(!editMii.studio[0])editMii.studio[0] = 8;
	editMii.studio[0x28] = editMii.mustacheScale;
	editMii.studio[0x2A] = editMii.mustacheYposition;
	editMii.studio[0x19] = editMii.glassesStyle;
	editMii.studio[0x17] = editMii.glassesColor;
	if(!editMii.studio[0x17]){
		editMii.studio[0x17] = 8;
	}else if(editMii.studio[0x17] < 6){
		editMii.studio[0x17] += 13;
	}else{
		editMii.studio[0x17] = 0;
	}
	editMii.studio[0x18] = editMii.glassesScale;
	editMii.studio[0x1A] = editMii.glassesYposition;
	editMii.studio[0x20] = editMii.enableMole;
	editMii.studio[0x1F] = editMii.moleScale;
	editMii.studio[0x21] = editMii.moleXposition;
	editMii.studio[0x22] = editMii.moleYposition;
	updateMiiPreview();
	setUI();
}

function miiEncode(){
	var i,tmpU32,tmpU16;
	var buf = new Uint8Array(MII_FILE_SIZE);
	buf[0] = editMii.unknown;
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
	buf[0x16] = 0;
	buf[0x17] = 0;
	buf[0x18] = getInt(editMii.isGirl) + (editMii.month << 1) + ((editMii.day & 7) << 5);
	buf[0x19] = (editMii.day >>> 3) + (editMii.favColor << 2) + (getInt(editMii.isFavorite) << 6);
	UTF16StringToBuf(buf,0x1A,MII_NAME_LENGTH,editMii.name,true);
	buf[0x2e] = editMii.height;
	buf[0x2f] = editMii.weight;
	buf[0x30] = getInt(!(editMii.sharing)) + (editMii.faceShape << 1) + (editMii.skinColor << 5);
	buf[0x31] = editMii.wrinkles + (editMii.makeup << 4);
	buf[0x32] = editMii.hairStyle;
	buf[0x33] = editMii.hairColor + (editMii.flipHair << 3);
	tmpU32 = editMii.eyeStyle + (editMii.eyeColor << 6) + (editMii.eyeScale << 9) + (editMii.eyeYscale << 13) + (editMii.eyeRotation << 16) + (editMii.eyeXspacing << 21) + (editMii.eyeYposition << 25);
	Uint32ToBuf(buf,0x34,tmpU32,true);
	tmpU32 = editMii.eyebrowStyle + (editMii.eyebrowColor << 5) + (editMii.eyebrowScale << 8) + (editMii.eyebrowYscale << 12) + (editMii.eyebrowRotation << 16) + (editMii.eyebrowXspacing << 21) + (editMii.eyebrowYposition << 25);
	Uint32ToBuf(buf,0x38,tmpU32,true);
	tmpU16 = editMii.noseStyle + (editMii.noseScale << 5) + (editMii.noseYposition << 9);
	Uint16ToBuf(buf,0x3C,tmpU16,true);
	tmpU16 = editMii.mouseStyle + (editMii.mouseColor << 6) + (editMii.mouseScale << 9) + (editMii.mouseYscale << 13);
	Uint16ToBuf(buf,0x3E,tmpU16,true);
	tmpU16 = editMii.mouseYposition + (editMii.mustacheStyle << 5);
	Uint16ToBuf(buf,0x40,tmpU16,true);
	tmpU16 = editMii.beardStyle + (editMii.beardColor << 3) + (editMii.mustacheScale << 6) + (editMii.mustacheYposition << 10);
	Uint16ToBuf(buf,0x42,tmpU16,true);
	tmpU16 = editMii.glassesStyle + (editMii.glassesColor << 4) + (editMii.glassesScale << 7) + (editMii.glassesYposition << 11);
	Uint16ToBuf(buf,0x44,tmpU16,true);
	tmpU16 = editMii.enableMole + (editMii.moleScale << 1) + (editMii.moleXposition << 5) + (editMii.moleYposition << 10);
	Uint16ToBuf(buf,0x46,tmpU16,true);
	UTF16StringToBuf(buf,0x48,MII_NAME_LENGTH,editMii.creatorName,true);
	rawData = buf;
}

function qrEncode(){
	if(!rawData)miiEncode();
	var encodedMii = encodeAesCcm(rawData);
	qrBase64 = makeQRFromBytes(encodedMii);
}