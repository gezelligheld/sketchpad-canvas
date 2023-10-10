export default function getPosition(
  canvas: HTMLCanvasElement,
  e: MouseEvent,
  scale: number
) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;
  return { x, y };
}
