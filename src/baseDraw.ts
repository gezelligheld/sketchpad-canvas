import Object from './object';

abstract class BaseDraw extends Object {
  declare render: (ctx: CanvasRenderingContext2D, ...rest: number[]) => void;
}

export default BaseDraw;
