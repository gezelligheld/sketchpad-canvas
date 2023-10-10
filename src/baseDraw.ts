import Object from './object';

abstract class BaseDraw<T = any> extends Object {
  declare left: number;

  declare top: number;

  declare positions: { x: number; y: number }[];

  declare render: (ctx: CanvasRenderingContext2D, options?: T) => void;

  declare move?: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
}

export default BaseDraw;
