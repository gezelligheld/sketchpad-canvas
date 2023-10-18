import { DragType, MIN_RESIZE_SIZE } from './constants';
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
  ): Position[] | null => {
    // 分析
    // 本质上还是移动，只是不同位置移动的偏移量的比例不同
    // 点集合中，越靠近鼠标位置的点与鼠标移动越同步，越远离鼠标位置的点越接近不变
    // 速率归一化处理，不变时为0，与鼠标移动速度相同时为1
    // 线性的对应关系会导致鼠标指针和初始的拖拽点分离，而且会随着鼠标移动位置越大会分离越多，且影响边界条件的判断，交互体验较差，但不会导致实例变形

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
    // 边界条件，缩放到一定程度不再变化
    let condition = false;
    switch (type) {
      case DragType.leftTop:
        condition =
          this.originData.right - x < MIN_RESIZE_SIZE ||
          this.originData.bottom - y < MIN_RESIZE_SIZE;
        break;
      case DragType.leftBottom:
        condition =
          this.originData.right - x < MIN_RESIZE_SIZE ||
          y - this.originData.top < MIN_RESIZE_SIZE;
        break;
      case DragType.rightTop:
        condition =
          x - this.originData.left < MIN_RESIZE_SIZE ||
          this.originData.bottom - y < MIN_RESIZE_SIZE;
        break;
      case DragType.rightBottom:
        condition =
          x - this.originData.left < MIN_RESIZE_SIZE ||
          y - this.originData.top < MIN_RESIZE_SIZE;
        break;
      case DragType.topMid:
        condition = this.originData.bottom - y < MIN_RESIZE_SIZE;
        break;
      case DragType.bottomMid:
        condition = y - this.originData.top < MIN_RESIZE_SIZE;
        break;
      case DragType.leftMid:
        condition = this.originData.right - x < MIN_RESIZE_SIZE;
        break;
      case DragType.rightMid:
        condition = x - this.originData.left < MIN_RESIZE_SIZE;
        break;
      default:
        break;
    }
    if (condition) {
      return null;
    }

    return this.originData.positions.map((p) => {
      let scaleObj = { x: 0, y: 0 };
      switch (type) {
        // 拖拽左上角，以右下角为基准点
        case DragType.leftTop:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (this.originData!.right - p.x) / p.x,
            (this.originData!.bottom - p.y) / p.y
          );
          break;
        // 拖拽左下角，以右上角为基准点
        case DragType.leftBottom:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (this.originData!.right - p.x) / p.x,
            (p.y - this.originData!.top) / p.y
          );
          break;
        // 拖拽右上角，以左下角为基准点
        case DragType.rightTop:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (p.x - this.originData!.left) / p.x,
            (this.originData!.bottom - p.y) / p.y
          );
          break;
        // 拖拽右下角，以左上角为基准点
        case DragType.rightBottom:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (p.x - this.originData!.left) / p.x,
            (p.y - this.originData!.top) / p.y
          );
          break;
        // 拖拽上中角，只朝y轴负方向变化
        case DragType.topMid:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            0,
            (this.originData!.bottom - p.y) / p.y
          );
          break;
        // 拖拽下中角，只朝y轴正方向变化
        case DragType.bottomMid:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            0,
            (p.y - this.originData!.top) / p.y
          );
          break;
        // 拖拽左中角，只朝x轴负方向变化
        case DragType.leftMid:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (this.originData!.right - p.x) / p.x,
            0
          );
          break;
        // 拖拽右中角，只朝x轴正方向变化
        case DragType.rightMid:
          scaleObj = this.getScale(
            type,
            p.x,
            p.y,
            (p.x - this.originData!.left) / p.x,
            0
          );
          break;
        default:
          break;
      }

      return {
        x: p.x + (x - this.originData!.x) * scaleObj.x,
        y: p.y + (y - this.originData!.y) * scaleObj.y,
      };
    });
  };

  // 为保证良好的交互，这里采用的方式是最靠近拖拽点位置的点速率直接与鼠标指针同步
  // 可能会变更策略，先单独抽出来
  private getScale = (
    type: DragType,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number
  ) => {
    switch (type) {
      case DragType.leftTop:
        return {
          x: x === this.originData?.left ? 1 : scaleX,
          y: y === this.originData?.top ? 1 : scaleY,
        };
      case DragType.leftBottom:
        return {
          x: x === this.originData?.left ? 1 : scaleX,
          y: y === this.originData?.bottom ? 1 : scaleY,
        };
      case DragType.rightTop:
        return {
          x: x === this.originData?.right ? 1 : scaleX,
          y: y === this.originData?.top ? 1 : scaleY,
        };
      case DragType.rightBottom:
        return {
          x: x === this.originData?.right ? 1 : scaleX,
          y: y === this.originData?.bottom ? 1 : scaleY,
        };
      case DragType.topMid:
        return {
          x: scaleX,
          y: y === this.originData?.top ? 1 : scaleY,
        };
      case DragType.bottomMid:
        return {
          x: scaleX,
          y: y === this.originData?.bottom ? 1 : scaleY,
        };
      case DragType.leftMid:
        return {
          x: x === this.originData?.left ? 1 : scaleX,
          y: scaleY,
        };
      case DragType.rightMid:
        return {
          x: x === this.originData?.right ? 1 : scaleX,
          y: scaleY,
        };
      default:
        return {
          x: scaleX,
          y: scaleY,
        };
    }
  };

  clearCache = () => {
    this.originData = null;
    this.previousPoint = null;
    this.currentPoint = null;
  };

  // 旋转
  rotate = (x: number, y: number, positions: Position[]) => {
    // 分析
    // 旋转中心为几何中心，需要先计算出旋转角度，点集合中随着该角度旋转
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
    // const centerX = (this.originData.left + this.originData.right) / 2;
    // const centerY = (this.originData.top + this.originData.bottom) / 2;
    // const initDeg = Math.atan2(
    //   this.originData.y - centerY,
    //   this.originData.x - centerX
    // );
    // const deg = Math.atan2(y - centerY, x - centerX);
    // return this.originData.positions.map((p) => {
    //   return {
    //     x: p.x * Math.cos(deg - initDeg),
    //     y: p.y * Math.sin(deg - initDeg),
    //   };
    // });
    return this.originData.positions;
  };
}

export default ObjectDrag;
