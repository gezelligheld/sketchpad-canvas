import BaseDraw from './baseDraw';
import Eraser from './eraser';
import ObjectStyle from './objectStyle';
import History from './history';
import Stroke from './stroke';
import { EventType, ObjectType } from './constants';
import Select from './select';
import BaseObjectRect from './baseObjectRect';
import getPosition from './utils/getPosition';
import Event from './event';
import { IObjectStyle } from './types';

interface SketchpadData {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  history: History<BaseObjectRect>;
  redoRecord: History<BaseObjectRect>;
  current: BaseDraw | null;
  options: SketchpadOptions | null;
  type: ObjectType;
  style: ObjectStyle;
  selectedObjects: BaseObjectRect[];
}

interface SketchpadOptions {
  scale?: number;
}

class Sketchpad extends Event<EventType> implements SketchpadData {
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

  // 所选中的实例
  selectedObjects: BaseObjectRect[] = [];

  // 当前正在绘制的实例
  declare current: BaseDraw | null;

  // 是否处于绘制中
  private drawing = false;

  // 是否要开始拖拽（可能是点选）
  private isDrag = false;

  // 是否拖拽
  private isDraging = false;

  // 上一次绘制的实例
  private previous: BaseDraw | null = null;

  constructor(canvas: HTMLCanvasElement, options?: SketchpadOptions) {
    super();
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

    this.on(EventType.historyAdd, (data) => {
      this.history.batchAdd(data);
    });
  }

  private onMouseDown = (e: MouseEvent) => {
    if (!this.ctx) {
      return;
    }
    this.drawing = true;
    const { x, y } = getPosition(this.canvas, e, this.scale);
    this.handleStartDrop(x, y);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.ctx || !this.drawing) {
      return;
    }
    const { x, y } = getPosition(this.canvas, e, this.scale);
    // 拖拽
    if (this.isDrag) {
      this.selectedObjects.forEach((o) => {
        o.move?.(x, y);
      });
      this.render();
      this.selectedObjects.forEach((o) => {
        (o as BaseObjectRect).drawRect(this.ctx);
      });
      this.isDraging = true;
      return;
    }
    this.paint();
    this.render();
    this.current?.render(this.ctx, {
      x,
      y,
      clearCanvas: this.clear,
    });
  };

  private onMouseUp = (e: MouseEvent) => {
    if (!this.ctx) {
      return;
    }
    this.handleSelectTypeWithoutMove(e);
    this.drawing = false;
    // 拖拽的过程没有生成新的实例，这里赋值给上一个实例
    if (this.isDraging) {
      this.current = this.previous;
      this.selectedObjects.forEach((o) => {
        o.stopMove?.();
      });
    }
    if (!this.current) {
      return;
    }
    // 不留痕
    if (this.current.type !== ObjectType.select) {
      this.emit(EventType.historyAdd, [this.current]);
    }

    // 只在拖动的时候显示，鼠标松开后消失
    if ([ObjectType.eraser, ObjectType.select].includes(this.current.type)) {
      this.render();
    }

    // 框选
    if (this.current.type === ObjectType.select) {
      if (this.isDrag) {
        this.selectedObjects.forEach((o) => {
          (o as BaseObjectRect).drawRect(this.ctx);
        });
      } else {
        const objects = (this.current as Select).getCheckedObjects(
          this.history.data
        );
        objects.forEach((o) => {
          (o as BaseObjectRect).drawRect(this.ctx);
        });
        this.selectedObjects = objects;
      }
    }

    this.previous = this.current;
    this.current = null;
    this.isDrag = false;
    this.isDraging = false;
  };

  // 没有移动鼠标框选的情况下点选
  private handleSelectTypeWithoutMove = (e: MouseEvent) => {
    if (this.type !== ObjectType.select || this.isDraging) {
      return;
    }
    const { x, y } = getPosition(this.canvas, e, this.scale);
    const target = this.history.data
      .filter(({ type }) => type !== ObjectType.eraser)
      // 后画的层级更高，先选中
      .reverse()
      .find(({ positions }) => {
        const left = Math.min(...positions.map(({ x }) => x));
        const right = Math.max(...positions.map(({ x }) => x));
        const top = Math.max(...positions.map(({ y }) => y));
        const bottom = Math.min(...positions.map(({ y }) => y));
        return (
          x < Math.max(left, right) &&
          x > Math.min(left, right) &&
          y < Math.max(top, bottom) &&
          y > Math.min(top, bottom)
        );
      });
    // 点击单个实例
    if (target) {
      this.render();
      (target as BaseObjectRect).drawRect(this.ctx);
      this.selectedObjects = [target];
    } else {
      // 点击空白处取消框选
      this.render();
      this.selectedObjects = [];
    }
  };

  // 开始移动
  private handleStartDrop = (x: number, y: number) => {
    if (this.type !== ObjectType.select || !this.selectedObjects.length) {
      return;
    }
    // 后选中的层级更高，先处理
    const temp = this.selectedObjects.reverse();
    for (let i = 0; i < temp.length; i++) {
      const { positions } = temp[i];
      const left = Math.min(...positions.map(({ x }) => x));
      const right = Math.max(...positions.map(({ x }) => x));
      const top = Math.max(...positions.map(({ y }) => y));
      const bottom = Math.min(...positions.map(({ y }) => y));
      if (
        x < Math.max(left, right) &&
        x > Math.min(left, right) &&
        y < Math.max(top, bottom) &&
        y > Math.min(top, bottom)
      ) {
        this.isDrag = true;
        break;
      } else {
        this.isDrag = false;
      }
    }
  };

  // 生成实例
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
    // 切换到非框选模式清空选择框
    if (type !== ObjectType.select && this.selectedObjects.length) {
      this.render();
      this.selectedObjects = [];
    }
  };

  // 渲染
  private render = () => {
    this.clear();
    this.objects.forEach((object) => {
      object.render(this.ctx, { clearCanvas: this.clear });
    });
  };

  // 设置样式
  setStyle = (style: Partial<IObjectStyle>) => {
    this.style.setStyle(style);
    this.selectedObjects.forEach((o) => {
      o.setStyle(style);
    });
    this.render();
  };

  // 销毁
  destroy = () => {
    if (!this.canvas) {
      return;
    }
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.offAll(EventType.historyAdd);
  };

  // 比例
  get scale() {
    return this.options?.scale || 1;
  }

  // 实例集合
  get objects() {
    return this.history.data.reduce((res, o) => {
      const index = res.findIndex(({ id }) => o.id === id);
      if (index !== -1) {
        // 靠近栈顶的实例是当前正在展示的，覆盖掉上一个
        res[index] = o;
      } else {
        res.push(o);
      }
      return res;
    }, [] as BaseObjectRect[]);
  }
}

export default Sketchpad;
