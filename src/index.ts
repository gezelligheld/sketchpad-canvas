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
          this.selectedObjects.forEach((o) => {
            const positions = o.drag.move(x, y, o.positions);
            positions && o.setPosition(positions);
          });
          this.render();
          this.drawRect();
          break;
        case DragType.rotate: {
          const target = this.selectedObjects.find(
            (t) => t.id === this.drag.targetId
          ) as BaseObjectRect<any>;
          this.clear();
          const positions = target.drag.rotate(
            this.ctx,
            x,
            y,
            target.positions
          );
          // 添加偏移，弥补旋转中心变化到几何中心的偏移
          positions && target?.setPosition(positions);
          target.render(this.ctx, { clearCanvas: this.clear });
          target.drawRect(this.ctx);
          // 复原变换矩阵
          this.ctx.resetTransform();
          // 复原偏移
          target?.drag.originData?.positions &&
            target?.setPosition(target?.drag.originData?.positions);
          this.render({ notClear: true });
          this.drawRect();
          break;
        }
        default: {
          const target = this.selectedObjects.find(
            (t) => t.id === this.drag.targetId
          );
          const positions = target?.drag.resize(
            x,
            y,
            target.positions,
            this.drag.status
          );
          positions && target?.setPosition(positions);
          this.render();
          this.drawRect();
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
      this.selectedObjects.forEach((o) => {
        o.drag.clearCache();
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
      if (this.drag.status !== DragType.init) {
        this.drawRect();
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
    this.drag.init();
  };

  // 没有移动鼠标框选的情况下点选
  private handleSelectTypeWithoutMove = (e: MouseEvent) => {
    if (this.type !== ObjectType.select || this.drag.isDraging) {
      return;
    }
    const { x, y } = getPosition(this.canvas, e);
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
    // todo 旋转后相对位置可能会变，需要提前记录
    const temp = this.selectedObjects.reverse();
    for (let i = 0; i < temp.length; i++) {
      const { positions, rect, id } = temp[i];
      const left = Math.min(...positions.map(({ x }) => x));
      const right = Math.max(...positions.map(({ x }) => x));
      const bottom = Math.max(...positions.map(({ y }) => y));
      const top = Math.min(...positions.map(({ y }) => y));
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
      this.selectedObjects = [];
    }
  };

  private drawRect = () => {
    this.selectedObjects.forEach((o) => {
      if (this.drag.status === DragType.rotate && o.id === this.drag.targetId) {
        return;
      }
      (o as BaseObjectRect).drawRect(this.ctx);
    });
  };

  // 渲染
  private render = (options?: { notClear: boolean }) => {
    if (!options?.notClear) {
      this.clear();
    }
    this.history.data.forEach((object) => {
      if (
        this.drag.status === DragType.rotate &&
        object.id === this.drag.targetId
      ) {
        return;
      }
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
}

export default Sketchpad;
