import getRandomString from './utils/getRandomString';

abstract class Object {
  declare top: number;

  declare left: number;

  declare id: string;

  constructor() {
    this.id = getRandomString(6);
  }
}

export default Object;
