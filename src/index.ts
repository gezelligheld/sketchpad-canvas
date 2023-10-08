import BaseDraw from './baseDraw';
import Eraser from './eraser';
import ObjectStyle from './objectStyle';
import History from './history';
import Stroke from './stroke';
import { ObjectType } from './types';
import Select from './select';
import ObjectRect from './objectRect';
import BaseObjectRect from './baseObjectRect';

interface SketchpadData {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  history: History<BaseDraw>;
  redoRecord: History<BaseDraw>;
  current: BaseDraw | null;
  options: SketchpadOptions | null;
  type: ObjectType;
  style: ObjectStyle;
}

interface SketchpadOptions {
  scale?: number;
}

class Sketchpad implements SketchpadData {
  declare ctx: CanvasRenderingContext2D;

  declare canvas: HTMLCanvasElement;

  declare options: SketchpadOptions | null;

  // 即将绘制的实例类型
  type = ObjectType.stroke;

  // 历史记录
  history = new History();

  // 回退记录
  redoRecord = new History();

  // 当前画笔样式
  style = new ObjectStyle();

  // 当前正在绘制的实例
  declare current: BaseDraw | null;

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
    this.render();
    const rect = this.canvas.getBoundingClientRect();
    this.current?.render(this.ctx, {
      x: (e.clientX - rect.left) * this.scale,
      y: (e.clientY - rect.top) * this.scale,
      clearCanvas: this.clear,
    });
  };

  private onMouseUp = () => {
    if (!this.ctx) {
      return;
    }
    this.drawing = false;
    if (!this.current) {
      return;
    }
    // 不留痕
    if (this.current.type !== ObjectType.select) {
      this.history.add(this.current);
    }
    // 只在拖动的时候显示，鼠标松开后消失
    if ([ObjectType.eraser, ObjectType.select].includes(this.current.type)) {
      this.render();
    }
    // 框选
    if (this.current.type === ObjectType.select) {
      const objects = (this.current as Select).getCheckedObjects(
        this.history.data
      );
      objects.forEach((o) => {
        console.log(o);
        (o as BaseObjectRect).drawRect(this.ctx);
      });
    }
    this.current = null;
  };

  paint = () => {
    if (this.current) {
      return;
    }
    switch (this.type) {
      case ObjectType.stroke:
        this.current = new Stroke(this.style.options);
        break;
      case ObjectType.eraser:
        this.current = new Eraser();
        break;
      case ObjectType.select:
        this.current = new Select();
        break;
      default:
        this.current = new Stroke(this.style.options);
        break;
    }
  };

  // 撤销
  undo = () => {
    if (!this.history.data.length) {
      return;
    }
    const cur = this.history.remove();
    this.redoRecord.add(cur!);
    this.render();
  };

  // 回退
  redo = () => {
    if (!this.redoRecord.data.length) {
      return;
    }
    const cur = this.redoRecord.remove();
    this.history.add(cur!);
    this.render();
  };

  // 清除画布
  clear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  // 切换模式
  setType = (type: ObjectType) => {
    this.type = type;
  };

  // 渲染
  private render = () => {
    this.clear();
    this.history.data.forEach((object) => {
      object.render(this.ctx, { clearCanvas: this.clear });
    });
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
