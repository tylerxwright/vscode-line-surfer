import * as vscode from 'vscode';
import DocumentDecorationManager from '../brackets/document-decoration-manager';
import { ConfigManager } from '../config/config-manager';
import { Wave } from './wave';

export class WaveManager {
  private configManager: ConfigManager;
  private documentManager: DocumentDecorationManager;
  private wave: Wave;

  constructor() {
    this.configManager = new ConfigManager();
    this.documentManager = new DocumentDecorationManager();
    this.wave = new Wave(this.configManager.config);

    //this.documentManager.updateAllDocuments();
    this.configureWave();
    this.createWave();
  }

  public registerChangeTextEditorSelection(): void {
    vscode.window.onDidChangeTextEditorSelection((evt: vscode.TextEditorSelectionChangeEvent) =>
      this.wave.render(evt.textEditor.selection.active.line, evt.textEditor),
    );
  }

  public registerChangeConfiguration(): void {
    vscode.workspace.onDidChangeConfiguration((evt: vscode.ConfigurationChangeEvent) => {
      if (evt.affectsConfiguration('lineSurfer')) {
        this.createWave();
      }
    });
  }

  private createWave() {
    this.configureWave();

    // This will not fire if you are in the settings dialog
    if (vscode.window.activeTextEditor !== undefined) {
      this.wave.render(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
    }
  }

  private configureWave() {
    this.wave.configure(this.configManager.config);
  }

  public dispose(): void {
    this.wave.dispose();
  }
}
