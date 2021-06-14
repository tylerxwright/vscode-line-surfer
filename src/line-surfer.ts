import { ConfigManager } from './config/config-manager';
import { DocumentManager } from './documents/document-manager';
import { WaveManager } from './wave/wave-manager';
import { ConfigurationChangeEvent, TextEditorSelectionChangeEvent, window, workspace } from 'vscode';
import { Mode } from './config/mode';
import { DocumentScope } from './documents/document-scope';

export class LineSurfer {
  private configManager: ConfigManager;
  private documentManager: DocumentManager;
  private waveManager: WaveManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.documentManager = new DocumentManager();

    let documentScope: DocumentScope | undefined = undefined;
    if (this.configManager.config.mode === Mode.Sticky && window.activeTextEditor !== undefined) {
      documentScope = this.documentManager.getDocumentScope(window.activeTextEditor);
    }
    this.waveManager = new WaveManager(this.configManager, documentScope);

    this.documentManager.updateAllDocuments();

    this.registerEvents();
  }

  private registerEvents() {
    window.onDidChangeTextEditorSelection((event: TextEditorSelectionChangeEvent) => {
      this.onChangeSelection(event);
    });
    workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
      this.onChangeConfiguration(event);
    });
  }

  private onChangeSelection(event: TextEditorSelectionChangeEvent) {
    const textEditor = event.textEditor;
    let documentScope: DocumentScope | undefined;

    if (this.configManager.config.mode === Mode.Sticky) {
      documentScope = this.documentManager.getDocumentScope(textEditor);
    }

    this.waveManager.render(event.textEditor, documentScope);
  }

  private onChangeConfiguration(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration('lineSurfer')) {
      this.waveManager.reset();
    }
  }

  public dispose(): void {
    this.waveManager.dispose();
  }
}
