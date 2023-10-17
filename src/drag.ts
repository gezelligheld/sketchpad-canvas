import { DragType } from './constants';

class Drag {
  status = DragType.init;

  // 是否拖拽，区分点选
  isDraging = false;

  setStatus = (status: Exclude<DragType, 'init'>) => {
    this.status = status;
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
