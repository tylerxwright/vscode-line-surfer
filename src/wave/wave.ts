import interpolate from 'color-interpolate';
import * as vscode from 'vscode';
import { TextEditor } from 'vscode';
import { Config } from '../config/config';
import { Mode } from '../config/mode';
import { DocumentScope } from '../documents/document-scope';

export class Wave {
  public above: vscode.TextEditorDecorationType[] = [];
  public below: vscode.TextEditorDecorationType[] = [];
  public center?: vscode.TextEditorDecorationType;
  private colormaps?: (index: number) => string;
  private config: Config;

  constructor(config: Config) {
    // I dont think config should persist like this
    this.config = config;
  }

  public initialize(config: Config, textEditor: TextEditor, documentScope?: DocumentScope): void {
    this.config = config;

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
    this.colormaps = interpolate(this.config.colors);
    this.center = this.createDecoration(0, 0);
    this.createWaveEdges(editor, documentScope);
  }

  private createWaveEdges(editor: TextEditor, documentScope?: DocumentScope) {
    const currentLineNumber = editor.selection.active.line;
    let aboveLineCount = this.config.amplitude;
    let belowLineCount = this.config.amplitude;

    if (this.config.mode === Mode.Sticky && documentScope !== undefined) {
      aboveLineCount = currentLineNumber - documentScope.startLineIndex;
      belowLineCount = documentScope.endLineIndex - currentLineNumber;
    }

    this.above = this.createWaveEdge(this.above, aboveLineCount);
    this.below = this.createWaveEdge(this.below, belowLineCount);
  }

  private createWaveEdge(
    waveEdge: vscode.TextEditorDecorationType[],
    amplitude: number,
  ): vscode.TextEditorDecorationType[] {
    for (let i = 1; i < amplitude; i++) {
      const edge = this.createDecoration(i, amplitude);
      waveEdge.push(edge);
    }

    return waveEdge;
  }

  public render(editor: TextEditor, documentScope?: DocumentScope): void {
    const lineNumber = editor.selection.active.line;

    this.reset();

    const hasSelection = this.hasSelection(editor);

    if (hasSelection) {
      return;
    }

    this.build(editor, documentScope);
    this.renderLine(lineNumber, 0, editor);

    for (let i = 1; i < this.above.length; i++) {
      this.renderLine(lineNumber, -i, editor);
    }

    for (let i = 1; i < this.below.length; i++) {
      this.renderLine(lineNumber, i, editor);
    }
  }

  private renderLine(lineNumber: number, offset: number, editor: vscode.TextEditor) {
    if (this.center === undefined) {
      return;
    }

    const line = editor.document.lineAt(lineNumber + offset);

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
        colorIndex === 0 ? this.config.fontWeight.toString() : this.getLineWeight(colorIndex, amplitude).toString(),
      isWholeLine: this.config.useWholeLine,
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

    if (amplitude === 1) {
      return this.colormaps(1);
    }

    return this.colormaps(((100 / (amplitude - 1)) * index) / 100);
  }

  private getLineWeight(index: number, amplitude: number): number {
    if (amplitude === 1) {
      return this.config.fontWeight;
    }

    return Number(this.config.fontWeight) - ((100 / (amplitude - 1)) * index * Number(this.config.fontWeight)) / 100;
  }

  public dispose(): void {
    this.reset();
  }
}
