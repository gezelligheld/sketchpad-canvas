import BaseDraw from './baseDraw';

class History<T extends BaseDraw> {
  data: T[] = [];

  add = (object: T) => {
    this.data.push(object);
  };

  remove = () => {
    const object = this.data.pop();
    return object as T;
  };
}

export default History;
