import * as vscode from 'vscode';
import interpolate from 'color-interpolate';
import { Config } from '../config/config';

export class Wave {
  public above: vscode.TextEditorDecorationType[] = [];
  public below: vscode.TextEditorDecorationType[] = [];
  public center?: vscode.TextEditorDecorationType;
  private colormaps?: (index: number) => string;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public configure(config: Config): void {
    this.config = config;

    this.reset();
    this.build();
  }

  public reset(): void {
    this.above.forEach((lineDecoration) => lineDecoration.dispose());
    this.below.forEach((lineDecoration) => lineDecoration.dispose());
    this.center?.dispose();

    this.center = undefined;
    this.above = [];
    this.below = [];
  }

  public build(): void {
    this.colormaps = interpolate(this.config.colors);

    this.center = this.createDecoration(0);

    for (let i = 1; i < this.config.amplitude; i++) {
      const above = this.createDecoration(i);
      const below = this.createDecoration(i);

      this.above.push(above);
      this.below.push(below);
    }
  }

  public render(lineNumber: number, editor: vscode.TextEditor): void {
    this.reset();

    const hasSelection = this.hasSelection(editor);

    if (hasSelection) {
      return;
    }

    this.build();
    this.renderLine(lineNumber, 0, editor);

    for (let i = 1; i < this.config.amplitude; i++) {
      this.renderLine(lineNumber, -i, editor);
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

  private createDecoration(colorIndex: number): vscode.TextEditorDecorationType {
    const decoration = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
      backgroundColor: this.getWaveColor(colorIndex),
      fontWeight: colorIndex === 0 ? this.config.fontWeight.toString() : this.getLineWeight(colorIndex).toString(),
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

  private getWaveColor(index: number): string {
    if (this.colormaps === undefined) {
      return 'none';
    }

    if (this.config.amplitude === 1) {
      return this.colormaps(1);
    }

    return this.colormaps(((100 / (this.config.amplitude - 1)) * index) / 100);
  }

  private getLineWeight(index: number): number {
    if (this.config.amplitude === 1) {
      return this.config.fontWeight;
    }

    return (
      Number(this.config.fontWeight) -
      ((100 / (this.config.amplitude - 1)) * index * Number(this.config.fontWeight)) / 100
    );
  }

  public dispose(): void {
    this.reset();
  }
}
