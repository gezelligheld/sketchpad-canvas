import BaseDraw from './baseDraw';
import { ObjectType } from './constants';

class Eraser extends BaseDraw {
  // 橡皮直径
  width = 20;

  positions: { x: number; y: number }[] = [];

  readonly type = ObjectType.eraser;

  constructor() {
    super();
  }

  setWidth = (width: number) => {
    this.width = width;
  };

  render = (
    ctx: CanvasRenderingContext2D,
    options: { x: number; y: number; clearCanvas: () => void }
  ) => {
    if (
      (!options?.x && options?.x !== 0) ||
      (!options?.y && options?.y !== 0)
    ) {
      this.renderCore(ctx, options?.clearCanvas);
      return;
    }
    const { x, y, clearCanvas } = options;
    this.positions.push({ x, y });
    this.renderCore(ctx, clearCanvas);
    this.drawEraser(ctx, x, y);
  };

  // 橡皮擦
  private drawEraser = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, this.width / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  };

  // 橡皮擦路径
  renderCore = (ctx: CanvasRenderingContext2D, clearCanvas: () => void) => {
    ctx.save();
    ctx.beginPath();
    for (let i = 1; i < this.positions.length; i++) {
      ctx.arc(
        this.positions[i].x,
        this.positions[i].y,
        this.width / 2,
        0,
        2 * Math.PI
      );
    }
    ctx.clip();
    // 这里的清除画布只作用于上面指定的裁剪区域
    clearCanvas();
    ctx.restore();
  };
}

export default Eraser;
