import { ConfigManager } from './config/config-manager';
import { DocumentManager } from './documents/document-manager';
import { WaveManager } from './wave/wave-manager';
import {
  ConfigurationChangeEvent,
  TextDocumentChangeEvent,
  TextEditor,
  TextEditorSelectionChangeEvent,
  window,
  workspace,
} from 'vscode';
import { Mode } from './config/mode';
import { DocumentScope } from './documents/document-scope';

export class LineSurfer {
  private configManager: ConfigManager;
  private documentManager: DocumentManager;
  private waveManager: WaveManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.documentManager = new DocumentManager();

    const documentScope = this.getDocumentScope();
    this.waveManager = new WaveManager(this.configManager, documentScope);

    this.documentManager.updateAllDocuments();
    this.registerEvents();
  }

  private getDocumentScope(textEditor: TextEditor | undefined = undefined): DocumentScope | undefined {
    if (textEditor === undefined) {
      textEditor = window.activeTextEditor;
    }
    let documentScope: DocumentScope | undefined = undefined;

    if (this.configManager.config.mode === Mode.Sticky && textEditor !== undefined) {
      documentScope = this.documentManager.getDocumentScope(textEditor);
    }

    return documentScope;
  }

  private registerEvents() {
    window.onDidChangeTextEditorSelection((event: TextEditorSelectionChangeEvent) => {
      this.onDidChangeTextEditorSelection(event);
    });
    workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
      this.onDidChangeConfiguration(event);
    });
    workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
      this.onDidChangeTextDocument(event);
    });
  }

  private onDidChangeTextEditorSelection(event: TextEditorSelectionChangeEvent) {
    const textEditor = event.textEditor;
    const documentScope = this.getDocumentScope(textEditor);

    this.waveManager.render(event.textEditor, documentScope);
  }

  private onDidChangeConfiguration(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration('lineSurfer')) {
      this.waveManager.reset();
    }
  }

  // This is not working correctly yet
  private onDidChangeTextDocument(event: TextDocumentChangeEvent) {
    if (event.contentChanges.length > 0) {
      this.documentManager.updateAllDocuments();

      const textEditor = window.activeTextEditor;
      if (textEditor !== undefined) {
        const documentScope = this.getDocumentScope();
        this.waveManager.render(textEditor, documentScope);
      }
    }
  }

  public dispose(): void {
    this.waveManager.dispose();
  }
}
