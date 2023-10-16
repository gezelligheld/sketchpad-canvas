export default function isInCircle(
  x: number,
  y: number,
  circleX: number,
  circleY: number,
  radius: number
) {
  const distance = Math.sqrt(
    Math.abs(x - circleX) ** 2 + Math.abs(y - circleY) ** 2
  );
  return distance <= radius;
}
