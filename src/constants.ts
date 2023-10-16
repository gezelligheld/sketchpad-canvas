// 默认边框色
export const STROKE_COLOR = '#1281f8';

// 默认填充色
export const FILL_COLOR = '#e8f4fc';

// 实例类型
export enum ObjectType {
  // 笔画
  stroke,
  // 橡皮
  eraser,
  // 框选
  select,
}

// 事件
export enum EventType {
  historyAdd = 'history-add',
}

// 拖拽类型
export enum DragType {
  inner = 'inner',
  leftTop = 'leftTop',
  topMid = 'topMid',
  rightTop = 'rightTop',
  rightMid = 'rightMid',
  rightBottom = 'rightBottom',
  bottomMid = 'bottomMid',
  leftBottom = 'leftBottom',
  leftMid = 'leftMid',
}
