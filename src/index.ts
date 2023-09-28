import BaseDraw from './baseDraw';
import History from './history';
import Object from './object';
import Stroke from './stroke';
import { ObjectType } from './types';

interface SketchpadData {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  history: History<Object>;
  current: BaseDraw;
  options: SketchpadOptions | null;
}

interface SketchpadOptions {
  scale?: number;
}

class Sketchpad implements SketchpadData {
  declare ctx: CanvasRenderingContext2D;

  declare canvas: HTMLCanvasElement;

  declare options: SketchpadOptions | null;

  history = new History();

  // 当前正在绘制的实例
  declare current: BaseDraw;

  private drawing = false;

  constructor(canvas: HTMLCanvasElement, options?: SketchpadOptions) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('canvas context not support');
    }
    this.ctx = ctx;
    this.canvas = canvas;
    this.options = options || null;
    // 默认为1倍图
    const scale = options?.scale || 1;
    this.canvas.width = parseFloat(this.canvas.style.width) * scale;
    this.canvas.height = parseFloat(this.canvas.style.height) * scale;
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseDown = (e: MouseEvent) => {
    if (!this.ctx) {
      return;
    }
    this.drawing = true;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.ctx || !this.drawing) {
      return;
    }
    this.paint();
    this.ctx.strokeStyle = '#000';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.current.render(
      this.ctx,
      e.clientX * this.scale,
      e.clientY * this.scale
    );
    this.ctx.restore();
  };

  private onMouseUp = () => {
    if (!this.ctx) {
      return;
    }
    this.drawing = false;
  };

  paint = (type?: ObjectType) => {
    if (this.current) {
      return;
    }
    switch (type) {
      case ObjectType.stroke:
        this.current = new Stroke();
        break;
      default:
        this.current = new Stroke();
        break;
    }
  };

  destroy = () => {
    if (!this.canvas) {
      return;
    }
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
  };

  get scale() {
    return this.options?.scale || 1;
  }
}

export default Sketchpad;
