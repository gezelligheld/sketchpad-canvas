import BaseDraw from './baseDraw';
import ObjectRect from './objectRect';
import { IObjectStyle } from './objectStyle';

abstract class BaseObjectRect<T = any> extends BaseDraw<T> {
  rect = new ObjectRect();

  declare move?: (x: number, y: number) => void;

  declare stopMove?: () => void;

  constructor(options?: Partial<IObjectStyle>) {
    super();
    if (options) {
      this.setStyle(options);
    }
  }

  drawRect = (ctx: CanvasRenderingContext2D) => {
    this.rect.drawRect(ctx, this.positions);
  };
}

export default BaseObjectRect;
