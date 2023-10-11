import BaseObjectRect from './baseObjectRect';

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
}

export default History;
