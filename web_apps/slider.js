class Slider{
    constructor(_sliderDiv, _knobDiv){
        this.valueChangedHandleFunc = null;
        this.valueChangedArg = null;
        this.isKnobGrabbed = false;
        this.lastFrameIsKnobGrabbed = false;
        this.sliderDiv = _sliderDiv;
        this.knobDiv = _knobDiv;
        this.maxValue = 500;
        this.value = 0;
        window.requestAnimationFrame(this.animationFrameHandler.bind(null, self));
    }
    animationFrameHandler(self){
        self.update();
        window.requestAnimationFrame(self.animationFrameHandler.bind(null, self));
    }
    update(){
        if(this.isKnobGrabbed){
            var sliderX = this.sliderDiv.getBoundingClientRect().left;
            
            this.value = this.calcValueByKnob();
        }else{
            if(this.lastFrameIsKnobGrabbed)this.valueChanged();
        }
        this.lastFrameIsKnobGrabbed = this.isKnobGrabbed;
    }
    setKnobByValue(){
        if(this.isKnobGrabbed)return;
        var sliderWidth = this.sliderDiv.getBoundingClientRect().right - this.sliderDiv.getBoundingClientRect().left;
        var knobXInSlider = (this.value / this.maxValue) * sliderWidth;
    }
    calcValueByKnob(){
        var sliderX = this.sliderDiv.getBoundingClientRect().left;
        var knobX = (this.knobDiv.getBoundingClientRect().left + this.knobDiv.getBoundingClientRect().right) / 2;
        var knobXInSlider = sliderX - knobX;
        var sliderWidth = this.sliderDiv.getBoundingClientRect().right - this.sliderDiv.getBoundingClientRect().left;
        return (sliderWidth / knobXInSlider) * this.maxValue;
    }
    valueChanged(){
        if(this,this.valueChangedHandleFunc)this.valueChangedHandleFunc(this.value, this.valueChangedArg);
    }
    knobClickHandler(e){
        this.self.kbonClick();
    }
    knobClick(){
        this.isKnobGrabbed = true;
    }
}