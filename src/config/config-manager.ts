import * as vscode from 'vscode';
import { Config } from './config';

export class ConfigManager {
  private _config: Config = {
    colors: [],
    amplitude: 1,
    fontWeight: 900,
    useWholeLine: false,
  };

  public get config(): Config {
    const config = vscode.workspace.getConfiguration('lineSurfer');

    this._config.colors = [config.get('crestColor') as string, config.get('troughColor') as string];
    this._config.amplitude = Number(config.get('amplitude'));
    this._config.fontWeight = Number(config.get('fontWeight'));
    this._config.useWholeLine = config.get('useWholeLine') as boolean;

    return this._config;
  }
}
