import BaseDraw from './baseDraw';
import { IObjectStyle } from './objectStyle';

abstract class BaseStyleDraw<T = any> extends BaseDraw<T> {
  constructor(options?: Partial<IObjectStyle>) {
    super();
    if (options) {
      this.setStyle(options);
    }
  }
}

export default BaseStyleDraw;
