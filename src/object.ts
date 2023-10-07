import ObjectStyle from './objectStyle';
import getRandomString from './utils/getRandomString';

abstract class Object extends ObjectStyle {
  declare top: number;

  declare left: number;

  declare id: string;

  constructor() {
    super();
    this.id = getRandomString(6);
  }
}

export default Object;
