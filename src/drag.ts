import { DragType } from './constants';

class Drag {
  status: {
    type: DragType;
    drag: boolean;
  }[] = [];

  constructor() {
    this.status = [
      { type: DragType.inner, drag: false },
      { type: DragType.leftTop, drag: false },
      { type: DragType.leftMid, drag: false },
      { type: DragType.leftBottom, drag: false },
      { type: DragType.rightTop, drag: false },
      { type: DragType.rightMid, drag: false },
      { type: DragType.rightBottom, drag: false },
      { type: DragType.topMid, drag: false },
      { type: DragType.bottomMid, drag: false },
    ];
  }

  setStatus = (target: DragType) => {
    this.status = this.status.map((item) => ({
      ...item,
      drag: item.type === target,
    }));
  };

  init = () => {
    this.status = this.status.map((item) => ({
      ...item,
      drag: false,
    }));
  };

  get current() {
    return this.status.find(({ drag }) => drag);
  }
}

export default Drag;
