const DPAD_UP = 0;
const DPAD_DOWN = 1;
const DPAD_LEFT = 2;
const DPAD_RIGHT = 3;

var sortCompFunc = function (a, b) {
    return a - b
}

function buttonHold(button){
    if(typeof button == "object") {
        return button.pressed;
    }
    return button == 1.0;
}

function dpad(value){
    //return [X, Y];
    if(value > 3)return [0, 0];
    if(value < -0.95)return [0, -1];//上
    if(value < -0.7 && value > -0.72)return [1, -1];//右上
    if(value < -0.4 && value > -0.45)return [1, 0];//右
    if(value < -0.1 && value > -0.2)return [1, 1];//右下
    if(value < 0.2 && value > 0.1)return [0, 1];//下
    if(value < 0.43 && value > 0.42)return [-1, 1];//左下
    if(value < 0.72 && value > 0.70)return [-1, 0];//左
    if(value > 0.95)return [-1, -1];//左上
    return [0, 0];
}

class gamepad{
    constructor(){
        this.gamepadconnectedHandler = null;
        this.curGamepadIndex = 0;
        this.gamepads = new Array();
        this.buttonRemappers = new Array();
        this.axisBehaveDpad = new Array();//アナログパッドのふりをした方向パッドのインデックス
        this.axesRemappers = new Array();
        var that = this;
        window.addEventListener("gamepadconnected", (e) => {
            that.gamepadconnected(e);
        });
        this.loadSettingsToDictFromLocalStorage();
        console.log(this.dict);
    }
    gamepadconnected(e){
        if(e.gamepad.idndex + 1 > this.gamepads.length){
            this.gamepads.length = e.gamepad.id + 1;
            this.buttonRemappers.length = e.gamepad.id + 1;
            this.axisBehaveDpad.length = e.gamepad.id + 1;
        }
        this.gamepads[e.gamepad.index] = e.gamepad;
        this.buttonRemappers[e.gamepad.index] = new Array();
        this.axisBehaveDpad[e.gamepad.index] = new Array();
        this.axesRemappers[e.gamepad.index] = new Array();
        for(var i = 0;i < e.gamepad.buttons.length;i++)this.buttonRemappers[e.gamepad.index].push(-1);
        this.checkAxisBehaveDpad(e.gamepad.axes, this.axisBehaveDpad[e.gamepad.index]);
        for(var i = 0;i < (e.gamepad.buttons.length + this.axisBehaveDpad[e.gamepad.index].length) * 2;i++)this.axesRemappers[e.gamepad.index].push(-1);
        console.log(e.gamepad);
        console.log(this);
        this.setSettingsFromDict();
        if(this.gamepadconnectedHandler)this.gamepadconnectedHandler();
    }
    findGamepads(){
        this.gamepads = navigator.getGamepads();
        if(this.curGamepadIndex >= this.gamepads.length || !this.gamepads[0] || !this.gamepads[this.curGamepadIndex].connected)return;
        this.checkAxisBehaveDpad(this.gamepads[this.curGamepadIndex].axes, this.axisBehaveDpad[this.curGamepadIndex]);
        if((this.axisBehaveDpad[this.curGamepadIndex].length + this.gamepads[this.curGamepadIndex].axes.length) * 2 > this.axesRemappers[this.curGamepadIndex].length){
            while((this.axisBehaveDpad[this.curGamepadIndex].length + this.gamepads[this.curGamepadIndex].axes.length) * 2 ==  this.axesRemappers[this.curGamepadIndex].length)this.axesRemappers[this.curGamepadIndex].push(-1);
        }
    }
    findValueForOption(snesbutton){
        for(var i = 0;i < this.buttonRemappers[this.curGamepadIndex].length;i++){
            if(this.buttonRemappers[this.curGamepadIndex][i] === snesbutton)return 1 + i;
        }
        for(var i = 0;i < this.axesRemappers[this.curGamepadIndex].length;i++){
            if(this.axesRemappers[this.curGamepadIndex][i] === snesbutton)return 1 + i + this.buttonRemappers[this.curGamepadIndex].length;
        }
        return 0;
    }
    getHoldButton(){
        this.gamepads = navigator.getGamepads();
        if(this.curGamepadIndex >= this.gamepads.length || !this.gamepads[0] || !this.gamepads[this.curGamepadIndex].connected)return 0;
        var dest = 0;
        this.checkAxisBehaveDpad(this.gamepads[this.curGamepadIndex].axes, this.axisBehaveDpad[this.curGamepadIndex]);
        for(var i = 0;i < this.gamepads[this.curGamepadIndex].buttons.length;i++){
            if(this.buttonRemappers[this.curGamepadIndex][i] < 0)continue;
            if(buttonHold(this.gamepads[this.curGamepadIndex].buttons[i]))dest |= (1 << this.buttonRemappers[this.curGamepadIndex][i]);
        }
        var realAxes = new Array();
        for(var i = 0;i < this.gamepads[this.curGamepadIndex].axes.length;i++){
            if(this.axisBehaveDpad[this.curGamepadIndex].includes(i))continue;
            realAxes.push(this.gamepads[this.curGamepadIndex].axes[i])
        }
        for(var i = 0;i < this.axisBehaveDpad[this.curGamepadIndex].length;i++){
            var val = dpad(this.gamepads[this.curGamepadIndex].axes[this.axisBehaveDpad[this.curGamepadIndex][i]]);
            realAxes.push(val[0]);
            realAxes.push(val[1]);
        }
        if(realAxes.length * 2 > this.axesRemappers[this.curGamepadIndex].length){
            while(realAxes.length * 2 ==  this.axesRemappers[this.curGamepadIndex].length)this.axesRemappers[this.curGamepadIndex].push(-1);
        }
        for(var i = 0;i < realAxes.length;i++){
            if(this.axesRemappers[this.curGamepadIndex][i * 2] > -1){
                if(realAxes[i] > 0.75)dest |= (1 << this.axesRemappers[this.curGamepadIndex][i * 2]);
            }
            if(this.axesRemappers[this.curGamepadIndex][i * 2 + 1] > -1){
                if(realAxes[i] < -0.75)dest |= (1 << this.axesRemappers[this.curGamepadIndex][i * 2 + 1]);
            }
        }
        return dest;
    }
    checkAxisBehaveDpad(axis, axisBehaveDpad){
        var foundDpad = false;
        for(var i = 0;i < axis.length;i++){
            if(axis[i] < 3)continue;//DPADではない
            foundDpad = true;
            if(!axisBehaveDpad.includes(i))axisBehaveDpad.push(i);
        }
        axisBehaveDpad.sort(sortCompFunc);
    }
    loadSettingsToDictFromLocalStorage(){
        this.dict = {
            version: 0,
            gamepads: {}
        };
        var dictBase64 = localStorage.getItem("gamepad_settings");
        if(!dictBase64)return;
        var dictJsonRaw = atob(dictBase64);
        var dictTmp = null;
        try{
            dictTmp = JSON.parse(dictJsonRaw);
        }catch{
            return;
        }
        if(dictTmp.version !== 0 || dictTmp.gamepads === undefined)return;
        this.dict = dictTmp;
    }
    setSettingsFromDict(){
        if(this.gamepads.length === 0 || !this.gamepads[0].id)return;
        var gamepadDict = this.dict.gamepads[this.gamepads[this.curGamepadIndex].id];
        if(!gamepadDict)return;
        var buttonRemapDict = gamepadDict.button_remappers;
        if(buttonRemapDict !== undefined){
            for(var i = 0;i < buttonRemapDict.length;i++){
                if(i >= this.buttonRemappers[this.curGamepadIndex].length)return;
                if(isNaN(buttonRemapDict[i])){
                    this.buttonRemappers[this.curGamepadIndex][i] = -1;
                }else{
                    this.buttonRemappers[this.curGamepadIndex][i] = buttonRemapDict[i];
                }
            }
        }
        var axesRemapDict = gamepadDict.axes_remappers;
        if(axesRemapDict !== undefined){
            for(var i = 0;i < axesRemapDict.length;i++){
                if(i >= this.axesRemappers[this.curGamepadIndex].length)return;
                if(isNaN(axesRemapDict[i])){
                    this.axesRemappers[this.curGamepadIndex][i] = -1;
                }else{
                    this.axesRemappers[this.curGamepadIndex][i] = axesRemapDict[i];
                }
            }
        }
    }
    saveSettingsToDict(){
        if(this.gamepads.length === 0 || !this.gamepads[0].id)return;
        var gamepadDict = {
            button_remappers: new Array(),
            axes_remappers: new Array()
        };
        for(var i = 0;i < this.buttonRemappers[this.curGamepadIndex].length;i++)gamepadDict.button_remappers.push(this.buttonRemappers[this.curGamepadIndex][i]);
        for(var i = 0;i < this.axesRemappers[this.curGamepadIndex].length;i++)gamepadDict.axes_remappers.push(this.axesRemappers[this.curGamepadIndex][i]);
        this.dict.gamepads[this.gamepads[this.curGamepadIndex].id] = gamepadDict;
    }
    saveDictToLocalStorage(){
        localStorage.setItem("gamepad_settings", btoa(JSON.stringify(this.dict)));
    }
}