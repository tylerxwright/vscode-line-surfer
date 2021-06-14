import { Mode } from './mode';

export interface Config {
  colors: string[];
  amplitude: number;
  fontWeight: number;
  useWholeLine: boolean;
  mode: Mode;
}
