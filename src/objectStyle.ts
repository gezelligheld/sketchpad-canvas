import { IObjectStyle } from './types';

class ObjectStyle {
  options = {
    // 轮廓颜色
    strokeStyle: '#000',

    // 线条粗细
    lineWidth: 1,
  };

  setStyle = (options: Partial<IObjectStyle>) => {
    this.options = { ...this.options, ...options };
  };
}

export default ObjectStyle;
