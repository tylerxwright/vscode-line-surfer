import * as vscode from 'vscode';
import interpolate from 'color-interpolate';
import { Config } from './config';

export default class Wave {
  private above: vscode.TextEditorDecorationType[] = [];

  private below: vscode.TextEditorDecorationType[] = [];

  private center?: vscode.TextEditorDecorationType;

  private config: Config = {
    colors: [],
    amplitude: 4,
    fontWeight: '900',
    useWholeLine: true,
  };

  private colormaps?: (index: number) => string;

  constructor() {
    this.reload();

    vscode.window.onDidChangeTextEditorSelection((evt: vscode.TextEditorSelectionChangeEvent) =>
      this.createWave(evt.textEditor.selection.active.line, evt.textEditor),
    );
    vscode.workspace.onDidChangeConfiguration((evt: vscode.ConfigurationChangeEvent) => {
      if (evt.affectsConfiguration('lineSurfer')) {
        this.reload();
      }
    });

    if (vscode.window.activeTextEditor !== undefined) {
      this.createWave(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
    }
  }

  private reload() {
    const config = vscode.workspace.getConfiguration('lineSurfer');

    this.reset();

    this.config.colors = [config.get('crestColor') as string, config.get('troughColor') as string];

    this.config.amplitude = Number(config.get('amplitude'));
    this.config.fontWeight = config.get('fontWeight') as string;
    this.config.useWholeLine = config.get('useWholeLine') as boolean;

    this.colormaps = interpolate(this.config.colors);

    this.initializeWaves();
  }

  reset(): void {
    this.above.forEach((lineDecoration) => lineDecoration.dispose());
    this.below.forEach((lineDecoration) => lineDecoration.dispose());
    this.center?.dispose();

    this.center = undefined;
    this.above = [];
    this.below = [];
  }

  private initializeWaves() {
    const centerWave = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
      backgroundColor: this.getWaveColor(0),
      fontWeight: this.config.fontWeight,
      isWholeLine: this.config.useWholeLine,
    });

    this.center = centerWave;

    for (let i = 1; i < this.config.amplitude; i++) {
      const aboveWave = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
        backgroundColor: this.getWaveColor(i),
        fontWeight: this.getLineWeight(i),
        isWholeLine: this.config.useWholeLine,
      });

      const belowWave = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
        backgroundColor: this.getWaveColor(i),
        fontWeight: this.getLineWeight(i),
        isWholeLine: this.config.useWholeLine,
      });

      this.above.push(aboveWave);
      this.below.push(belowWave);
    }
  }

  private getWaveColor(index: number): string {
    if (this.colormaps === undefined) {
      return '#000000';
    }

    if (this.config.amplitude === 1) {
      return this.colormaps(1);
    }

    return this.colormaps(((100 / (this.config.amplitude - 1)) * index) / 100);
  }

  private getLineWeight(index: number): string {
    if (this.config.amplitude === 1) {
      return this.config.fontWeight;
    }

    return (
      Number(this.config.fontWeight) -
      ((100 / (this.config.amplitude - 1)) * index * Number(this.config.fontWeight)) / 100
    ).toString();
  }

  private createWave(lineNumber: number, editor: vscode.TextEditor) {
    const rangeLength =
      editor.document.offsetAt(editor.selection.end) - editor.document.offsetAt(editor.selection.start);

    if (rangeLength > 0) {
      this.reset();
    } else {
      this.reset();
      this.initializeWaves();
    }

    this.decorateLine(lineNumber, 0, editor);

    for (let i = 1; i < this.config.amplitude; i++) {
      this.decorateLine(lineNumber, -i, editor);
      this.decorateLine(lineNumber, i, editor);
    }
  }

  private decorateLine(lineNumber: number, offset: number, editor: vscode.TextEditor) {
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
}
