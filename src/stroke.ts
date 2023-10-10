import { ObjectType } from './types';
import { IObjectStyle } from './objectStyle';
import BaseObjectRect from './baseObjectRect';

class Stroke extends BaseObjectRect {
  positions: { x: number; y: number }[] = [];

  private currentPoint: { x: number; y: number } | null = null;

  private previousPoint: { x: number; y: number } | null = null;

  readonly type = ObjectType.stroke;

  constructor(options?: Partial<IObjectStyle>) {
    super(options);
  }

  render = (
    ctx: CanvasRenderingContext2D,
    options?: { x: number; y: number }
  ) => {
    if (
      (!options?.x && options?.x !== 0) ||
      (!options?.y && options?.y !== 0)
    ) {
      this.renderCore(ctx);
      return;
    }
    const { x, y } = options;
    this.positions.push({ x, y });
    this.renderCore(ctx);
  };

  private renderCore = (ctx: CanvasRenderingContext2D) => {
    if (this.positions.length < 2) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = this.options.strokeStyle;
    ctx.lineWidth = this.options.lineWidth;
    for (let i = 1; i < this.positions.length; i++) {
      ctx.beginPath();
      const current = this.positions[i];
      const last = this.positions[i - 1];
      const penultimate = this.positions[i - 2];
      if (i === 1) {
        ctx.moveTo(current.x, current.y);
        continue;
      }
      // 起始位置取倒数第二个点和倒数第一个点的中点，终止点取倒数第二个点和倒数第一个点的中点
      // 控制点取倒数第二个点
      ctx.moveTo((penultimate.x + last.x) / 2, (penultimate.y + last.y) / 2);
      ctx.quadraticCurveTo(
        last.x,
        last.y,
        (last.x + current.x) / 2,
        (last.y + current.y) / 2
      );
      ctx.stroke();
    }
    ctx.restore();
  };

  move = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    this.previousPoint = this.currentPoint || { x, y };
    this.currentPoint = { x, y };
    this.positions = this.positions.map((p) => ({
      x: p.x + (this.currentPoint!.x - this.previousPoint!.x),
      y: p.y + (this.currentPoint!.y - this.previousPoint!.y),
    }));
  };
}

export default Stroke;
