import Sketchpad from '@/index';

const canvas = document.getElementById('demo');
if (canvas) {
  new Sketchpad(canvas as HTMLCanvasElement, { scale: 2 });
}
