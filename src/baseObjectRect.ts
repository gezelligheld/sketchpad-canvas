import ObjectDrag from './objectDrag';
import BaseDraw from './baseDraw';
import ObjectRect from './objectRect';
import { IObjectStyle, Position } from './types';

abstract class BaseObjectRect<T = any> extends BaseDraw<T> {
  rect = new ObjectRect();

  drag = new ObjectDrag();

  constructor(options?: Partial<IObjectStyle>) {
    super();
    if (options) {
      this.setStyle(options);
    }
  }

  drawRect = (ctx: CanvasRenderingContext2D) => {
    this.rect.drawRect(ctx, this.positions);
  };

  setPosition = (positions: Position[]) => {
    this.positions = positions;
  };
}

export default BaseObjectRect;
