import { DragType } from './constants';

class Drag {
  status = [
    { type: DragType.inner, drag: false, action: 'move' },
    { type: DragType.leftTop, drag: false, action: 'move' },
    { type: DragType.leftMid, drag: false, action: 'move' },
    { type: DragType.leftBottom, drag: false, action: 'move' },
    { type: DragType.rightTop, drag: false, action: 'move' },
    { type: DragType.rightMid, drag: false, action: 'move' },
    { type: DragType.rightBottom, drag: false, action: 'move' },
    { type: DragType.topMid, drag: false, action: 'move' },
    { type: DragType.bottomMid, drag: false, action: 'move' },
  ];

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
