import { ObjectType } from './types';
import { IObjectStyle } from './objectStyle';
import BaseStyleDraw from './baseStyleDraw';

class Stroke extends BaseStyleDraw {
  top = 0;

  left = 0;

  positions: { x: number; y: number }[] = [];

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
}

export default Stroke;
