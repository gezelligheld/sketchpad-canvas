import Object from './object';

abstract class BaseDraw<T = any> extends Object {
  declare left: number;

  declare top: number;

  declare positions: { x: number; y: number }[];

  declare render: (ctx: CanvasRenderingContext2D, options?: T) => void;
}

export default BaseDraw;
