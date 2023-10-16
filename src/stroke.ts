import { ObjectType } from './constants';
import BaseObjectRect from './baseObjectRect';
import { IObjectStyle } from './types';

class Stroke extends BaseObjectRect {
  positions: { x: number; y: number }[] = [];

  private currentPoint: { x: number; y: number } | null = null;

  private previousPoint: { x: number; y: number } | null = null;

  private originData: {
    x: number;
    y: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    positions: { x: number; y: number }[];
  } | null = null;

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

  move = (x: number, y: number) => {
    this.previousPoint = this.currentPoint || { x, y };
    this.currentPoint = { x, y };
    this.positions = this.positions.map((p) => ({
      x: p.x + (this.currentPoint!.x - this.previousPoint!.x),
      y: p.y + (this.currentPoint!.y - this.previousPoint!.y),
    }));
  };

  stopMove = () => {
    this.previousPoint = null;
    this.currentPoint = null;
  };

  resize = (x: number, y: number) => {
    // 分析
    // 本质上还是移动，只是不同位置移动的偏移量的比例不同
    // 点集合中，越靠近鼠标位置的点与鼠标移动越同步，越远离鼠标位置的点越接近不变
    // 速率归一化处理，不变时为0，与鼠标移动速度相同时为1

    // 标明起点和初始的位置信息
    if (!this.originData) {
      const left = Math.min(...this.positions.map(({ x }) => x));
      const right = Math.max(...this.positions.map(({ x }) => x));
      const top = Math.min(...this.positions.map(({ y }) => y));
      const bottom = Math.max(...this.positions.map(({ y }) => y));
      this.originData = {
        x,
        y,
        left,
        top,
        right,
        bottom: bottom,
        positions: this.positions.map((p) => ({ ...p })),
      };
    }
    this.positions = this.originData.positions.map((p) => {
      const scaleX = (this.originData!.right - p.x) / p.x;
      const scaleY = (this.originData!.bottom - p.y) / p.y;
      return {
        x: p.x + (x - this.originData!.x) * scaleX,
        y: p.y + (y - this.originData!.y) * scaleY,
      };
    });
  };
}

export default Stroke;
