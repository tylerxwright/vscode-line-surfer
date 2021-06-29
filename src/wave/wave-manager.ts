import { TextEditor, window } from 'vscode';
import { ConfigManager } from '../config/config-manager';
import { DocumentScope } from '../documents/document-scope';
import { Wave } from './wave';

export class WaveManager {
  private configManager: ConfigManager;
  private wave: Wave;

  constructor(configManager: ConfigManager, documentScope?: DocumentScope) {
    this.configManager = configManager;
    this.wave = new Wave(this.configManager);

    this.initializeWave(documentScope);
    this.createWave(documentScope);
  }

  public render(textEditor: TextEditor, documentScope?: DocumentScope): void {
    this.wave.render(textEditor, documentScope);
  }

  public reset(): void {
    this.createWave();
  }

  private createWave(documentScope?: DocumentScope) {
    if (window.activeTextEditor !== undefined) {
      this.wave.initialize(window.activeTextEditor, documentScope);
      this.wave.render(window.activeTextEditor, documentScope);
    }
  }

  private initializeWave(documentScope?: DocumentScope) {
    if (window.activeTextEditor !== undefined) {
      this.wave.initialize(window.activeTextEditor, documentScope);
    }
  }

  public dispose(): void {
    this.wave.dispose();
  }
}
