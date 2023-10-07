import Sketchpad from '@/index';

const canvas = document.getElementById('demo');
const sketchpad = new Sketchpad(canvas as HTMLCanvasElement, { scale: 1 });

const undo = document.getElementById('undo');
undo!.onclick = () => {
  sketchpad.undo();
};

const redo = document.getElementById('redo');
redo!.onclick = () => {
  sketchpad.redo();
};
