import BaseStyleDraw from './baseStyleDraw';
import { IObjectStyle } from './objectStyle';
import { STROKE_COLOR } from './constants';

class ObjectRect extends BaseStyleDraw {
  constructor(options?: Partial<IObjectStyle>) {
    super(options);
    this.options.strokeStyle = STROKE_COLOR;
  }

  // 选中的框
  drawRect = (
    ctx: CanvasRenderingContext2D,
    positions: {
      x: number;
      y: number;
    }[]
  ) => {
    if (!positions.length) {
      return;
    }
    ctx.save();
    const left = Math.min(...positions.map(({ x }) => x));
    const right = Math.max(...positions.map(({ x }) => x));
    const top = Math.max(...positions.map(({ y }) => y));
    const bottom = Math.min(...positions.map(({ y }) => y));
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.stroke();
    ctx.restore();
  };
}

export default ObjectRect;
