import BaseDraw from './baseDraw';
import { ObjectType } from './types';

class Stroke extends BaseDraw {
  top = 0;

  left = 0;

  positions: { x: number; y: number }[] = [];

  strokeStyle = '#000';

  readonly type = ObjectType.stroke;

  constructor() {
    super();
  }

  render = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    this.positions.push({ x, y });
    if (this.positions.length < 2) {
      return;
    }
    ctx.strokeStyle = this.strokeStyle;
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
      // 拉扯点取倒数第二个点
      ctx.moveTo((penultimate.x + last.x) / 2, (penultimate.y + last.y) / 2);
      ctx.quadraticCurveTo(
        last.x,
        last.y,
        (last.x + current.x) / 2,
        (last.y + current.y) / 2
      );
      ctx.stroke();
    }
  };
}

export default Stroke;
