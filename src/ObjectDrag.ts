import { DragType } from './constants';
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
  resize = (
    x: number,
    y: number,
    positions: Position[],
    type: DragType
  ): Position[] => {
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
      let scaleX = 0;
      let scaleY = 0;
      switch (type) {
        // 拖拽左上角，以右下角为基准点
        case DragType.leftTop:
          scaleX = (this.originData!.right - p.x) / p.x;
          scaleY = (this.originData!.bottom - p.y) / p.y;
          break;
        // 拖拽左下角，以右上角为基准点
        case DragType.leftBottom:
          scaleX = (this.originData!.right - p.x) / p.x;
          scaleY = (p.y - this.originData!.top) / p.y;
          break;
        // 拖拽右上角，以左下角为基准点
        case DragType.rightTop:
          scaleX = (p.x - this.originData!.left) / p.x;
          scaleY = (this.originData!.bottom - p.y) / p.y;
          break;
        // 拖拽右下角，以左上角为基准点
        case DragType.rightBottom:
          scaleX = (p.x - this.originData!.left) / p.x;
          scaleY = (p.y - this.originData!.top) / p.y;
          break;
        // 拖拽上中角，只朝y轴负方向变化
        case DragType.topMid:
          scaleY = (this.originData!.bottom - p.y) / p.y;
          break;
        // 拖拽下中角，只朝y轴正方向变化
        case DragType.bottomMid:
          scaleY = (p.y - this.originData!.top) / p.y;
          break;
        // 拖拽左中角，只朝x轴负方向变化
        case DragType.leftMid:
          scaleX = (this.originData!.right - p.x) / p.x;
          break;
        // 拖拽右中角，只朝x轴正方向变化
        case DragType.rightMid:
          scaleX = (p.x - this.originData!.left) / p.x;
          break;
        default:
          break;
      }

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
