import { Wave } from './wave';

let wave: Wave;

export function activate() {
    wave = new Wave();
}

export function deactivate() {
    wave.reset();
}
