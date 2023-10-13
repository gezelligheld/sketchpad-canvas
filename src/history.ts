import BaseObjectRect from './baseObjectRect';
import { IObjectStyle } from './types';

interface HistoryData {
  // 位置
  positions: { x: number; y: number }[];
  // 样式
  style: IObjectStyle;
}

class History<T extends BaseObjectRect> {
  data: T[] = [];

  add = (object: T) => {
    this.data.push(object);
  };

  remove = () => {
    if (!this.data.length) {
      return;
    }
    const object = this.data.pop();
    return object as T;
  };

  batchAdd = (objects: T[]) => {
    this.data = this.data.concat(objects);
  };
}

export default History;
