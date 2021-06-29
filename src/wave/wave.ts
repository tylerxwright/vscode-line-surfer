import interpolate from 'color-interpolate';
import * as vscode from 'vscode';
import { TextEditor } from 'vscode';
import { ConfigManager } from '../config/config-manager';
import { Mode } from '../config/mode';
import { DocumentScope } from '../documents/document-scope';
import { RenderDirection } from './render-direction';

export class Wave {
  public above: vscode.TextEditorDecorationType[] = [];
  public below: vscode.TextEditorDecorationType[] = [];
  public center?: vscode.TextEditorDecorationType;
  private colormaps?: (index: number) => string;
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  public initialize(textEditor: TextEditor, documentScope?: DocumentScope): void {
    this.reset();
    this.build(textEditor, documentScope);
  }

  public reset(): void {
    this.above.forEach((lineDecoration) => lineDecoration.dispose());
    this.below.forEach((lineDecoration) => lineDecoration.dispose());
    this.center?.dispose();

    this.center = undefined;
    this.above = [];
    this.below = [];
  }

  public build(editor: TextEditor, documentScope?: DocumentScope): void {
    this.colormaps = interpolate(this.configManager.config.colors);
    this.center = this.createDecoration(0, 1);
    this.createWaveEdges(editor, documentScope);
  }

  private createWaveEdges(editor: TextEditor, documentScope?: DocumentScope) {
    const currentLineNumber = editor.selection.active.line + 1;
    let aboveLineCount = this.configManager.config.amplitude;
    let belowLineCount = this.configManager.config.amplitude;

    if (this.configManager.config.mode === Mode.Sticky && documentScope !== undefined) {
      aboveLineCount = currentLineNumber - documentScope.startLineIndex - 1;
      belowLineCount = documentScope.endLineIndex - currentLineNumber + 1;
    }

    console.log(
      `Current Line: ${currentLineNumber} | Start Line: ${documentScope?.startLineIndex} | End Line: ${documentScope?.endLineIndex}`,
    );
    console.log(`Lines Above: ${aboveLineCount} | Lines Below: ${belowLineCount}`);

    this.above = this.createWaveEdge(this.above, aboveLineCount);
    this.below = this.createWaveEdge(this.below, belowLineCount);
  }

  private createWaveEdge(
    waveEdge: vscode.TextEditorDecorationType[],
    amplitude: number,
  ): vscode.TextEditorDecorationType[] {
    for (let i = 1; i <= amplitude; i++) {
      const edge = this.createDecoration(i, amplitude);
      waveEdge.push(edge);
    }

    return waveEdge;
  }

  public render(editor: TextEditor, documentScope?: DocumentScope): void {
    this.reset();

    const hasSelection = this.hasSelection(editor);
    if (hasSelection) {
      return;
    }

    const lineNumber = editor.selection.active.line + 1;

    this.build(editor, documentScope);
    this.renderLine(lineNumber, 0, editor);

    this.renderLines(this.above.length, RenderDirection.Up, lineNumber, editor);
    this.renderLines(this.below.length, RenderDirection.Down, lineNumber, editor);
  }

  private renderLines(
    lineCount: number,
    renderDirection: RenderDirection,
    lineNumber: number,
    editor: vscode.TextEditor,
  ) {
    for (let i = 1; i <= lineCount; i++) {
      this.renderLine(lineNumber, i * renderDirection, editor);
    }
  }

  private renderLine(lineNumber: number, offset: number, editor: vscode.TextEditor) {
    if (this.center === undefined) {
      return;
    }

    const line = editor.document.lineAt(lineNumber + offset - 1);

    let waveDecoration = this.center;
    if (offset < 0) {
      waveDecoration = this.above[Math.abs(offset) - 1];
    } else if (offset > 0) {
      waveDecoration = this.below[Math.abs(offset) - 1];
    }

    editor.setDecorations(waveDecoration, [line]);
  }

  private createDecoration(colorIndex: number, amplitude: number): vscode.TextEditorDecorationType {
    const decoration = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
      backgroundColor: this.getWaveColor(colorIndex, amplitude),
      fontWeight:
        colorIndex === 0
          ? this.configManager.config.fontWeight.toString()
          : this.getLineWeight(colorIndex, amplitude).toString(),
      isWholeLine: this.configManager.config.useWholeLine,
    });

    return decoration;
  }

  hasSelection(editor: vscode.TextEditor): boolean {
    const end = editor.document.offsetAt(editor.selection.end);
    const start = editor.document.offsetAt(editor.selection.start);
    const length = end - start;

    return length > 0;
  }

  private getWaveColor(index: number, amplitude: number): string {
    if (this.colormaps === undefined) {
      return 'none';
    }

    if (amplitude === 1 && this.configManager.config.mode === Mode.Normal) {
      return this.colormaps(0);
    }

    const color = this.colormaps(((100 / amplitude) * index) / 100);
    return color;
  }

  private getLineWeight(index: number, amplitude: number): number {
    if (amplitude === 1) {
      return this.configManager.config.fontWeight;
    }

    return (
      Number(this.configManager.config.fontWeight) -
      ((100 / amplitude) * index * Number(this.configManager.config.fontWeight)) / 100
    );
  }

  public dispose(): void {
    this.reset();
  }
}
