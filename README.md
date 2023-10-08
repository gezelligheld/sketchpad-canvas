# canvas 画板

- 橡皮擦
- 选中拖拽
- 批量修改样式

#### 继承关系

```
ObjectStyle -> Object -> BaseDraw
                            \
                             -> Eraser
                            \
                             -> BaseStyleDraw -> ObjectRect
                            \
                             -> BaseObjectRect -> Stroke
                            \
                             -> Select
```
