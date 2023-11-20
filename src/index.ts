import BaseDraw from './baseDraw';
import Eraser from './eraser';
import ObjectStyle from './objectStyle';
import History from './history';
import Stroke from './stroke';
import { EventType, ObjectType, DragType } from './constants';
import Select from './select';
import BaseObjectRect from './baseObjectRect';
import getPosition from './utils/getPosition';
import isInCircle from './utils/isInCircle';
import Event from './event';
import { IObjectStyle, Position } from './types';
import Drag from './drag';

interface SketchpadData {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  history: History<BaseObjectRect>;
  redoRecord: History<BaseObjectRect>;
  current: BaseDraw | null;
  options: SketchpadOptions | null;
  type: ObjectType;
  style: ObjectStyle;
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

  // 拖拽相关逻辑
  drag = new Drag();

  // 当前正在绘制的实例
  declare current: BaseDraw | null;

  // 是否处于绘制中
  private drawing = false;

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
    const scale = options?.scale || window.devicePixelRatio;
    this.canvas.width = parseFloat(this.canvas.style.width) * scale;
    this.canvas.height = parseFloat(this.canvas.style.height) * scale;
    // 根据scale自动缩放画布，防止画布内的元素模糊
    ctx.scale(scale, scale);
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
    const { x, y } = getPosition(this.canvas, e);
    this.handleStartDrop(x, y);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.ctx || !this.drawing) {
      return;
    }
    const { x, y } = getPosition(this.canvas, e);
    // 拖拽
    if (this.drag.status !== DragType.init) {
      this.drag.setIsDraging(true);

      switch (this.drag.status) {
        case DragType.inner:
          this.clear();
          this.selectedObjects.forEach((o) => {
            o.drag.move(this.ctx, x, y, o.positions);
          });
          this.render({ notClear: true });
          break;
        case DragType.rotate: {
          const target = this.selectedObjects.find(
            (t) => t.id === this.drag.targetId
          );
          this.clear();
          target?.drag.rotate(this.ctx, x, y, target.positions);
          this.render({ notClear: true });
          break;
        }
        default: {
          this.clear();
          const target = this.selectedObjects.find(
            (t) => t.id === this.drag.targetId
          );
          target?.drag.resize(
            this.ctx,
            x,
            y,
            target.positions,
            this.drag.status
          );
          this.render({ notClear: true });
          break;
        }
      }
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
    if (this.drag.isDraging) {
      this.current = this.previous;
    }
    if (!this.current) {
      return;
    }
    // 不留痕
    if (this.current.type !== ObjectType.select) {
      this.emit(EventType.historyAdd, [this.current]);
    }

    // 框选
    if (this.current.type === ObjectType.select) {
      if (this.drag.status !== DragType.init) {
        this.selectAll(true);
      } else {
        const objects = (this.current as Select).getCheckedObjects(
          this.history.data
        );
        objects.forEach((o) => {
          o.select(true);
        });
      }
    }

    // 只在拖动的时候显示，鼠标松开后消失
    if ([ObjectType.eraser, ObjectType.select].includes(this.current.type)) {
      this.render();
    }

    this.previous = this.current;
    this.current = null;
    this.drag.init();
  };

  // 没有移动鼠标框选的情况下点选
  private handleSelectTypeWithoutMove = (e: MouseEvent) => {
    if (this.type !== ObjectType.select || this.drag.isDraging) {
      return;
    }
    const { x: originX, y: originY } = getPosition(this.canvas, e);
    const target = this.history.data
      .filter(({ type }) => type !== ObjectType.eraser)
      .find(({ positions, drag }) => {
        let left = Math.min(...positions.map(({ x }) => x));
        let right = Math.max(...positions.map(({ x }) => x));
        let top = Math.max(...positions.map(({ y }) => y));
        let bottom = Math.min(...positions.map(({ y }) => y));
        let x = originX;
        let y = originY;
        if (drag.matrix) {
          // a 水平缩放
          // d 垂直缩放
          // c 水平倾斜
          // b 垂直倾斜
          // e 水平移动
          // f 垂直移动
          const { a, b, c, d, e, f } = drag.matrix;
          x = (x - e / 2) / a;
          y = (y - f / 2) / d;
        }
        return (
          x < Math.max(left, right) &&
          x > Math.min(left, right) &&
          y < Math.max(top, bottom) &&
          y > Math.min(top, bottom)
        );
      });
    // 点击单个实例
    if (target) {
      this.selectAll(false);
      (target as BaseObjectRect).select(true);
      this.render();
    } else {
      // 点击空白处取消框选
      this.selectAll(false);
      this.render();
    }
  };

  // 开始移动
  private handleStartDrop = (mouseX: number, mouseY: number) => {
    if (this.type !== ObjectType.select || !this.selectedObjects.length) {
      return;
    }
    for (let i = 0; i < this.selectedObjects.length; i++) {
      const { positions, rect, id, drag } = this.selectedObjects[i];
      let left = Math.min(...positions.map(({ x }) => x));
      let right = Math.max(...positions.map(({ x }) => x));
      let bottom = Math.max(...positions.map(({ y }) => y));
      let top = Math.min(...positions.map(({ y }) => y));
      let x = mouseX;
      let y = mouseY;
      // 如果是存在变换矩阵的实例，需要计算出变换前对应的的鼠标位置
      if (drag.matrix) {
        // a 水平缩放
        // d 垂直缩放
        // c 水平倾斜
        // b 垂直倾斜
        // e 水平移动
        // f 垂直移动
        const { a, b, c, d, e, f } = drag.matrix;
        x = (x - e / 2) / a;
        y = (y - f / 2) / d;
        console.log(
          mouseX - (drag.originData?.x || 0),
          mouseY - (drag.originData?.y || 0),
          e,
          f
        );
      }
      // 左上
      if (isInCircle(x, y, left, top, rect.pointRadius)) {
        this.drag.setStatus(DragType.leftTop, id);
        break;
      }
      // 左下
      if (isInCircle(x, y, left, bottom, rect.pointRadius)) {
        this.drag.setStatus(DragType.leftBottom, id);
        break;
      }
      // 右上
      if (isInCircle(x, y, right, top, rect.pointRadius)) {
        this.drag.setStatus(DragType.rightTop, id);
        break;
      }
      // 右下
      if (isInCircle(x, y, right, bottom, rect.pointRadius)) {
        this.drag.setStatus(DragType.rightBottom, id);
        break;
      }
      if (Math.abs(top - bottom) > rect.pointRadius * 2) {
        // 左中
        if (
          isInCircle(x, y, left, bottom + (top - bottom) / 2, rect.pointRadius)
        ) {
          this.drag.setStatus(DragType.leftMid, id);
          break;
        }
        // 右中
        if (
          isInCircle(x, y, right, bottom + (top - bottom) / 2, rect.pointRadius)
        ) {
          this.drag.setStatus(DragType.rightMid, id);
          break;
        }
      }
      if (Math.abs(right - left) > rect.pointRadius * 2) {
        // 上中
        if (
          isInCircle(x, y, left + (right - left) / 2, top, rect.pointRadius)
        ) {
          this.drag.setStatus(DragType.topMid, id);
          break;
        }
        // 下中
        if (
          isInCircle(x, y, left + (right - left) / 2, bottom, rect.pointRadius)
        ) {
          this.drag.setStatus(DragType.bottomMid, id);
          break;
        }
      }
      // 旋转点
      if (
        isInCircle(
          x,
          y,
          left + (right - left) / 2,
          top - rect.pointDistance,
          rect.pointRadius
        )
      ) {
        this.drag.setStatus(DragType.rotate, id);
        break;
      }
      if (x < right && x > left && y < bottom && y > top) {
        this.drag.setStatus(DragType.inner, id);
        break;
      }
      this.drag.init();
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
      this.selectAll(false);
    }
  };

  // 取消全选
  private selectAll = (selected: boolean) => {
    this.selectedObjects.forEach((o) => {
      o.select(selected);
    });
  };

  // 渲染
  // 渲染管线：改变变换矩阵 -> 渲染当前实例和选中框 -> 复原变换矩阵 -> 渲染其他实例和选中框
  private render = (options?: Partial<{ notClear: boolean }>) => {
    if (!options?.notClear) {
      this.clear();
    }
    let flag = false;
    this.history.data.forEach((object) => {
      if (object.drag.matrix) {
        object.render(this.ctx, { clearCanvas: this.clear });
        flag && this.ctx.resetTransform();
        this.ctx.setTransform(object.drag.matrix);
        flag = true;
        const { x, y } = object.drag.offsetByOriginChange;
        // 缩放和旋转时产生的平移需要弥补偏移
        if (x || y) {
          object.setPosition(
            object.positions.map((p) => ({
              x: x ? p.x - x : p.x,
              y: y ? p.y - y : p.y,
            }))
          );
        }
        object.render(this.ctx, { clearCanvas: this.clear });
        object.selected && object.drawRect(this.ctx);
        // 渲染后复原偏移
        if (x || y) {
          object.setPosition(
            object.positions.map((p) => ({
              x: x ? p.x + x : p.x,
              y: y ? p.y + y : p.y,
            }))
          );
        }
      } else if (flag) {
        // 复原变换矩阵
        this.ctx.resetTransform();
        flag = false;
        object.render(this.ctx, { clearCanvas: this.clear });
        object.selected && object.drawRect(this.ctx);
      } else {
        object.render(this.ctx, { clearCanvas: this.clear });
        object.selected && object.drawRect(this.ctx);
      }
    });

    if (flag) {
      // 复原变换矩阵
      this.ctx.resetTransform();
    }
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

  // 所选中的实例
  get selectedObjects() {
    return this.history.data.filter((o) => o.selected);
  }
}

export default Sketchpad;
