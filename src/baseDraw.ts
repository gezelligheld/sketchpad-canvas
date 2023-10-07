import Object from './object';
import { ObjectType } from './types';

abstract class BaseDraw extends Object {
  declare type: ObjectType;

  declare render: (ctx: CanvasRenderingContext2D, ...rest: number[]) => void;
}

export default BaseDraw;
