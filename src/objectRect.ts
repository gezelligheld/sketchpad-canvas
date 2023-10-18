import BaseStyleDraw from './baseStyleDraw';
import { IObjectStyle } from './types';
import { STROKE_COLOR } from './constants';

class ObjectRect extends BaseStyleDraw {
  // 点直径
  pointRadius = 5;

  // 旋转触发点距离
  pointDistance = 16;

  constructor(options?: Partial<IObjectStyle>) {
    super(options);
    this.options.strokeStyle = STROKE_COLOR;
  }

  // 选中框
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
    const top = Math.min(...positions.map(({ y }) => y));
    const bottom = Math.max(...positions.map(({ y }) => y));
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.stroke();
    ctx.restore();
    this.drawRotatePoint(ctx, { left, right, top, bottom });
    this.drawRectPoint(ctx, { left, right, top, bottom });
  };

  // 选中框的点
  drawRectPoint = (
    ctx: CanvasRenderingContext2D,
    position: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
  ) => {
    const { left, right, top, bottom } = position;
    ctx.save();
    ctx.fillStyle = '#fff';
    this.drawPoint(ctx, left, top);
    this.drawPoint(ctx, right, top);
    this.drawPoint(ctx, right, bottom);
    this.drawPoint(ctx, left, bottom);
    // 高度过窄不显示左中和右中两个点
    if (Math.abs(top - bottom) > this.pointRadius * 2) {
      this.drawPoint(ctx, right, bottom + (top - bottom) / 2);
      this.drawPoint(ctx, left, bottom + (top - bottom) / 2);
    }
    // 宽度过窄不显示上中和下中两个点
    if (Math.abs(right - left) > this.pointRadius * 2) {
      this.drawPoint(ctx, left + (right - left) / 2, top);
      this.drawPoint(ctx, left + (right - left) / 2, bottom);
    }
    ctx.restore();
  };

  // 点
  private drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, this.pointRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
  };

  // 旋转触发点
  private drawRotatePoint = (
    ctx: CanvasRenderingContext2D,
    position: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
  ) => {
    ctx.save();
    const { left, right, top } = position;
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(left + (right - left) / 2, top);
    ctx.lineTo(left + (right - left) / 2, top - this.pointDistance);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#000';
    this.drawPoint(ctx, left + (right - left) / 2, top - this.pointDistance);
    ctx.restore();
  };
}

export default ObjectRect;
