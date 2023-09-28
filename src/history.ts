import Object from './object';

class History<T extends Object> {
  data: T[] = [];

  add = (object: T) => {
    this.data.push(object);
  };

  remove = () => {
    const object = this.data.pop();
    return object;
  };
}

export default History;
