import BaseDraw from './baseDraw';
import { ObjectType } from './types';
import { STROKE_COLOR, FILL_COLOR } from './constants';

class Select extends BaseDraw {
  start: { x: number; y: number } | null = null;

  end: { x: number; y: number } | null = null;

  readonly type = ObjectType.select;

  constructor() {
    super();
  }

  render = (
    ctx: CanvasRenderingContext2D,
    options: { x: number; y: number }
  ) => {
    const { x, y } = options;
    if (!this.start) {
      this.start = { x, y };
    }
    ctx.save();
    ctx.strokeStyle = STROKE_COLOR;
    ctx.fillStyle = FILL_COLOR;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.rect(this.start.x, this.start.y, x - this.start.x, y - this.start.y);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
    this.end = { x, y };
  };

  // 框选区域内的实例
  getCheckedObjects = (objects: BaseDraw[]) => {
    if (!this.start || !this.end) {
      return [];
    }
    return objects
      .filter(({ type }) => type !== ObjectType.eraser)
      .filter((o) => {
        if (!o.positions) {
          return false;
        }
        return o.positions.some(
          ({ x, y }) =>
            x < Math.max(this.start!.x, this.end!.x) &&
            x > Math.min(this.start!.x, this.end!.x) &&
            y < Math.max(this.start!.y, this.end!.y) &&
            y > Math.min(this.start!.y, this.end!.y)
        );
      });
  };
}

export default Select;
