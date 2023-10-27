import { DragType, MIN_RESIZE_SIZE } from './constants';
import { Position } from './types';

class ObjectDrag {
  originData: {
    x: number;
    y: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    positions: Position[];
  } | null = null;

  // 当前变换矩阵
  matrix: DOMMatrix | null = null;

  // 移动
  move = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    positions: Position[]
  ) => {
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
        bottom,
        positions: positions.map((p) => ({ ...p })),
      };
    }
    ctx.translate(x - this.originData.x, y - this.originData.y);
    this.matrix = ctx.getTransform();
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
        bottom,
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

  // 旋转
  rotate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    positions: Position[]
  ) => {
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
        bottom,
        positions: positions.map((p) => ({ ...p })),
      };
    }
    // 几何中心
    const centerX = (this.originData.left + this.originData.right) / 2;
    const centerY = (this.originData.top + this.originData.bottom) / 2;
    // 初始弧度
    const initRadian = Math.atan2(
      this.originData.y - centerY,
      this.originData.x - centerX
    );
    // 当前弧度
    const radian = Math.atan2(y - centerY, x - centerX);
    const offsetRadian = radian - initRadian;
    // 修改旋转中心为几何中心，默认画布左上角
    ctx.translate(centerX, centerY);
    ctx.rotate(offsetRadian);
    this.matrix = ctx.getTransform();
  };

  // 坐标原点变化时的偏移
  get offsetPositions() {
    if (!this.originData) {
      return null;
    }
    // 几何中心
    const centerX = (this.originData.left + this.originData.right) / 2;
    const centerY = (this.originData.top + this.originData.bottom) / 2;
    return this.originData.positions.map((p) => ({
      x: p.x - centerX,
      y: p.y - centerY,
    }));
  }
}

export default ObjectDrag;
