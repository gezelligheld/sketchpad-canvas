import Sketchpad from '@/index';
import { IObjectStyle } from '@/objectStyle';

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

const type = document.getElementById('type');
type!.onchange = (e: any) => {
  sketchpad.setType(Number(e.target?.value));
};

const strokecolor = document.getElementById('strokecolor');
const linewidth = document.getElementById('linewidth');
const style = document.getElementById('style');
let options: Partial<IObjectStyle> = {};
strokecolor!.onchange = (e: any) => {
  options.strokeStyle = e.target?.value;
};
linewidth!.onchange = (e: any) => {
  options.lineWidth = e.target?.value;
};
style!.onclick = () => {
  sketchpad.style.setStyle(options);
};
