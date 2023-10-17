import { Position } from './types';

class ObjectDrag {
  private originData: {
    x: number;
    y: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    positions: Position[];
  } | null = null;

  private currentPoint: Position | null = null;

  private previousPoint: Position | null = null;

  // 移动
  move = (x: number, y: number, positions: Position[]): Position[] => {
    this.previousPoint = this.currentPoint || { x, y };
    this.currentPoint = { x, y };
    return positions.map((p) => ({
      x: p.x + (this.currentPoint!.x - this.previousPoint!.x),
      y: p.y + (this.currentPoint!.y - this.previousPoint!.y),
    }));
  };

  // 缩放
  resize = (x: number, y: number, positions: Position[]): Position[] => {
    // 分析
    // 本质上还是移动，只是不同位置移动的偏移量的比例不同
    // 点集合中，越靠近鼠标位置的点与鼠标移动越同步，越远离鼠标位置的点越接近不变
    // 速率归一化处理，不变时为0，与鼠标移动速度相同时为1

    // 标明起点和初始的位置信息
    if (!this.originData) {
      const left = Math.min(...positions.map(({ x }) => x));
      const right = Math.max(...positions.map(({ x }) => x));
      const top = Math.min(...positions.map(({ y }) => y));
      const bottom = Math.max(...positions.map(({ y }) => y));
      this.originData = {
        x,
        y,
        left,
        top,
        right,
        bottom: bottom,
        positions: positions.map((p) => ({ ...p })),
      };
    }
    return this.originData.positions.map((p) => {
      const scaleX = (this.originData!.right - p.x) / p.x;
      const scaleY = (this.originData!.bottom - p.y) / p.y;
      return {
        x: p.x + (x - this.originData!.x) * scaleX,
        y: p.y + (y - this.originData!.y) * scaleY,
      };
    });
  };

  clearCache = () => {
    this.originData = null;
    this.previousPoint = null;
    this.currentPoint = null;
  };
}

export default ObjectDrag;
