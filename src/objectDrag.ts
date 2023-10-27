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
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    positions: Position[],
    type: DragType
  ) => {
    // 缩放本质上还是移动，只是不同位置移动的偏移量的比例不同
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

    const width = this.originData.right - this.originData.left;
    const height = this.originData.bottom - this.originData.top;
    switch (type) {
      // 拖拽左上角，以右下角为基准点
      case DragType.leftTop:
        ctx.translate(this.originData.right, this.originData.bottom);
        ctx.scale(
          (this.originData.right - x) / width,
          (this.originData.bottom - y) / height
        );
        break;
      // 拖拽左下角，以右上角为基准点
      case DragType.leftBottom:
        ctx.translate(this.originData.right, this.originData.top);
        ctx.scale(
          (this.originData.right - x) / width,
          (y - this.originData.top) / height
        );
        break;
      // 拖拽右上角，以左下角为基准点
      case DragType.rightTop:
        ctx.translate(this.originData.left, this.originData.bottom);
        ctx.scale(
          (x - this.originData.left) / width,
          (this.originData.bottom - y) / height
        );
        break;
      // 拖拽右下角，以左上角为基准点
      case DragType.rightBottom:
        ctx.translate(this.originData.left, this.originData.top);
        ctx.scale(
          (x - this.originData.left) / width,
          (y - this.originData.top) / height
        );
        break;
      // 拖拽上中角，只朝y轴负方向变化
      case DragType.topMid:
        ctx.translate(this.originData.left + width / 2, this.originData.bottom);
        ctx.scale(1, (this.originData.bottom - y) / height);
        break;
      // 拖拽下中角，只朝y轴正方向变化
      case DragType.bottomMid:
        ctx.translate(this.originData.left + width / 2, this.originData.top);
        ctx.scale(1, (y - this.originData.top) / height);
        break;
      // 拖拽左中角，只朝x轴负方向变化
      case DragType.leftMid:
        ctx.translate(this.originData.right, this.originData.top + height / 2);
        ctx.scale((this.originData.right - x) / width, 1);
        break;
      // 拖拽右中角，只朝x轴正方向变化
      case DragType.rightMid:
        ctx.translate(this.originData.left, this.originData.top + height / 2);
        ctx.scale((x - this.originData.left) / width, 1);
        break;
      default:
        break;
    }
    this.matrix = ctx.getTransform();
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
}

export default ObjectDrag;
