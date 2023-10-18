import { DragType } from './constants';

class Drag {
  status = DragType.init;

  // 是否拖拽，区分点选
  isDraging = false;

  // 当前要拖拽的实例
  targetId = '';

  setStatus = (status: Exclude<DragType, 'init'>, id: string) => {
    this.status = status;
    this.targetId = id;
  };

  setIsDraging = (isDraging: boolean) => {
    this.isDraging = isDraging;
  };

  init = () => {
    this.status = DragType.init;
    this.isDraging = false;
  };
}

export default Drag;
