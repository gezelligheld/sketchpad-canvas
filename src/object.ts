import ObjectStyle from './objectStyle';
import getRandomString from './utils/getRandomString';
import { ObjectType } from './constants';

abstract class Object extends ObjectStyle {
  declare id: string;

  declare readonly type: ObjectType;

  constructor() {
    super();
    this.id = getRandomString(6);
  }
}

export default Object;
