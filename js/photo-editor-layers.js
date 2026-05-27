class Layer {
  constructor(name, width, height, type = 'image') {
    this.name = name || 'Layer';
    this.type = type;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.visible = true;
    this.opacity = 1;
    this.blendMode = 'normal';
  }
  clear() { this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); }
  drawImage(img, x=0, y=0, w, h) { this.ctx.drawImage(img, x, y, w||img.width, h||img.height); }
  getDataURL() { return this.canvas.toDataURL(); }
}

class LayerManager {
  constructor(mainCanvas) {
    this.mainCanvas = mainCanvas;
    this.mainCtx = mainCanvas.getContext('2d');
    this.layers = [];
    this.activeLayerIndex = -1;
  }
  addLayer(name, width, height, type='image') {
    const layer = new Layer(name, width||this.mainCanvas.width, height||this.mainCanvas.height, type);
    this.layers.push(layer);
    this.activeLayerIndex = this.layers.length-1;
    return layer;
  }
  removeLayer(index) {
    if(this.layers.length <= 1) return false;
    this.layers.splice(index,1);
    this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length-1);
    return true;
  }
  getActiveLayer() { return this.layers[this.activeLayerIndex]; }
  setActiveLayer(index) { if(index>=0 && index<this.layers.length) this.activeLayerIndex=index; }
  composite() {
    const ctx = this.mainCtx;
    ctx.clearRect(0,0,this.mainCanvas.width,this.mainCanvas.height);
    for(const layer of this.layers) {
      if(!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas,0,0);
      ctx.restore();
    }
  }
  flatten() {
    if(this.layers.length<=1) return;
    const flat = new Layer('flattened', this.mainCanvas.width, this.mainCanvas.height);
    flat.ctx.drawImage(this.mainCanvas,0,0);
    this.layers = [flat];
    this.activeLayerIndex = 0;
    this.composite();
  }
  reset(mainImg) {
    this.layers = [];
    this.mainCanvas.width = mainImg.width;
    this.mainCanvas.height = mainImg.height;
    this.addLayer('Background', mainImg.width, mainImg.height);
    this.getActiveLayer().drawImage(mainImg);
    this.composite();
  }
}