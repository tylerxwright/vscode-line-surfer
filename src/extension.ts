import { LineSurfer } from './line-surfer';

let lineSurfer: LineSurfer;

export function activate(): void {
  lineSurfer = new LineSurfer();
}

export function deactivate(): void {
  lineSurfer.dispose();
}
