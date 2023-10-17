# canvas 画板

- 画线 √
- 橡皮擦 √
- 点选、框选 √
- 选中拖拽 √
- 修改样式 √
- 选中放大、缩小
- 选中旋转
- 复制粘贴
- 画直线
- 裁剪
- 填充
- 撤销回退
- 历史记录

#### 继承组合关系

```
Event -> Sketchpad
         (ObjectStyle、History、Eraser、Stroke、Select、Drag)

ObjectStyle -> Object -> BaseDraw
                            \
                             -> Eraser
                            \
                             -> BaseStyleDraw -> ObjectRect
                            \
                             -> BaseObjectRect -> Stroke
                                (ObjectRect、ObjectDrag)
                            \
                             -> Select
```
