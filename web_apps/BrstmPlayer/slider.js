class MousePos{
    constructor(){
        this.x = 0;
        this.y = 0;
        document.getElementsByTagName('body')[0].addEventListener("mousemove", {handleEvent: this.mouseMoveHandler, self: this});
        document.getElementsByTagName('body')[0].addEventListener("touchmove", {handleEvent: this.mouseMoveHandler, self: this});
    }
    mouseMoveHandler(e){
        this.self.mouseMove(e);
    }
    mouseMove(e){
        this.x = e.touches[0].pageX;
        this.y = e.touches[0].pageY;
    }
}

var mp = new MousePos();

function getElementLeft(element){
    return element.getBoundingClientRect().left + window.pageXOffset;
}

function getElementRight(element){
    return element.getBoundingClientRect().right + window.pageXOffset;
}

class SimpleSlider{
    constructor(_maxValue, _sliderDiv, _knobDiv){
        this.sliderBar = new SliderBar(_maxValue, _sliderDiv);
        this.knob = new SliderKnob(this.sliderBar, _knobDiv);
    }
}

class SliderBar{
    constructor(_maxValue, _sliderDiv){
        this.maxValue = _maxValue;
        this.sliderDiv = _sliderDiv;
    }
}

class SliderKnob{
    constructor(_slider, _knobDiv){
        this.valueChangedHandleFunc = null;
        this.valueChangedArg = null;
        this.isKnobGrabbed = false;
        this.lastFrameIsKnobGrabbed = false;
        this.slider = _slider;
        this.knobDiv = _knobDiv;
        this.value = 0;
        this.lastFrameValue = 0;
        this.setKnobByValue();
        this.knobDiv.addEventListener("mousedown", {handleEvent: this.knobClickHandler, self: this});
        this.knobDiv.addEventListener("touchstart", {handleEvent: this.knobClickHandler, self: this});
        document.getElementsByTagName('body')[0].addEventListener("mouseup", {handleEvent: this.bodyMouseupHandler, self: this});
        document.getElementsByTagName('body')[0].addEventListener("touchend", {handleEvent: this.bodyMouseupHandler, self: this});
        window.requestAnimationFrame(this.animationFrameHandler.bind(null, this));
    }
    animationFrameHandler(self){
        self.update();
        window.requestAnimationFrame(self.animationFrameHandler.bind(null, self));
    }
    update(){
        if(this.isKnobGrabbed){//knobが掴まれてるか判断
            this.value = this.calcValueByMouseX(mp.x);
        }else{
            if(this.lastFrameIsKnobGrabbed)this.valueChanged();
        }
        this.lastFrameIsKnobGrabbed = this.isKnobGrabbed;
        this.lastFrameValue = this.value;
        this.setKnobByValue();
    }
    setKnobByValue(){
        var sliderWidth = getElementRight(this.slider.sliderDiv) - getElementLeft(this.slider.sliderDiv);
        var knobXInSlider = (this.value / this.slider.maxValue) * sliderWidth;//スライダーからの相対的なX位置
        var knobDivWidth = getElementRight(this.knobDiv) - getElementLeft(this.knobDiv);
        this.knobDiv.style.left = knobXInSlider - (knobDivWidth / 2) + "px";
    }
    calcValueByMouseX(mouseX){
        var sliderWidth = getElementRight(this.slider.sliderDiv) - getElementLeft(this.slider.sliderDiv);
        var sliderX = getElementLeft(this.slider.sliderDiv);
        var mouseXInSlider = mouseX - sliderX;
        if(mouseXInSlider < 0)return 0;
        if(mouseXInSlider > sliderWidth)return this.slider.maxValue;
        return (mouseXInSlider / sliderWidth) * this.slider.maxValue;
    }
    valueChanged(){
        if(this.valueChangedHandleFunc)this.valueChangedHandleFunc(this.valueChangedArg, this.lastFrameValue);
    }
    knobClickHandler(e){
        this.self.knobClick();
    }
    knobClick(){
        this.isKnobGrabbed = true;
    }
    bodyMouseupHandler(e){
        this.self.bodyMouseup();
    }
    bodyMouseup(){
        this.isKnobGrabbed = false;
    }
    setValue(targetValue){//外部からの値変更
        if(!this.isKnobGrabbed){
            if(targetValue > this.slider.maxValue)targetValue =  this.slider.maxValue;
            this.value = targetValue;
            this.setKnobByValue();
        }
    }
}