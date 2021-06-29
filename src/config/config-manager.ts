import * as vscode from 'vscode';
import { Config } from './config';
import { Mode } from './mode';

export class ConfigManager {
  private _config: Config = {
    colors: [],
    amplitude: 1,
    fontWeight: 900,
    useWholeLine: false,
    mode: Mode.Normal,
  };

  public get config(): Config {
    const config = vscode.workspace.getConfiguration('lineSurfer');

    this._config.colors = [config.get('crestColor') as string, config.get('troughColor') as string];
    this._config.amplitude = Number(config.get('amplitude'));
    this._config.fontWeight = Number(config.get('fontWeight'));
    this._config.useWholeLine = config.get('useWholeLine') as boolean;
    this._config.mode = this.getMode(config.get('mode') as string);

    return this._config;
  }

  private getMode(mode: string): Mode {
    mode = mode.charAt(0).toUpperCase() + mode.slice(1);
    if (Mode[mode] === undefined) {
      return Mode.Normal;
    }
    return Mode[mode];
  }
}
