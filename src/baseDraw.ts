import Object from './object';
import { ObjectType } from './types';

abstract class BaseDraw<T = any> extends Object {
  declare readonly type: ObjectType;

  declare positions: { x: number; y: number }[];

  declare render: (ctx: CanvasRenderingContext2D, options?: T) => void;
}

export default BaseDraw;
