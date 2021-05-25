import * as vscode from 'vscode';
import { DecorationRenderOptions, TextEditor, TextEditorDecorationType, TextEditorSelectionChangeEvent } from 'vscode';
import interpolate from 'color-interpolate';

class Wave {
    above: TextEditorDecorationType[] = [];
    below: TextEditorDecorationType[] = [];
    center?: TextEditorDecorationType;
    colors: string[] = [];
    amplitude: number = 3;
    
    colormaps?: (index: number) => string;

    constructor(context: vscode.ExtensionContext) {
        this.reload();

        let disposable = vscode.commands.registerCommand('line-surfer.surf', () => {
            vscode.window.showInformationMessage('Surfs up!');
            vscode.window.onDidChangeTextEditorSelection(
                (evt: TextEditorSelectionChangeEvent) => this.createWave(
                    evt.textEditor.selection.active.line, 
                    evt.textEditor
                )
            );
            vscode.workspace.onDidChangeConfiguration(
                (evt: vscode.ConfigurationChangeEvent) => {
                    if(evt.affectsConfiguration('lineSurfer')) {
                        this.reload();
                    }
                }
            );
        });
    
        context.subscriptions.push(disposable);
    
        if(vscode.window.activeTextEditor !== undefined) {
            this.createWave(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
        }
    }

    reload() {
        const config = vscode.workspace.getConfiguration('lineSurfer');

        this.above.forEach((lineDecoration) => lineDecoration.dispose());
        this.below.forEach((lineDecoration) => lineDecoration.dispose());
        this.center?.dispose();

        this.center = undefined;
        this.above = [];
        this.below = [];

        this.colors = [
            config.get('crestColor') as string, 
            config.get('troughColor') as string
        ];

        this.amplitude = Number(config.get('amplitude'));

        this.colormaps = interpolate(this.colors);

        this.initializeWaves();
    }

    initializeWaves() {
        const centerWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: this.getWaveColor(0),
            fontWeight: '900',
        });
    
        this.center = centerWave;
    
        for(let i=1; i<this.amplitude; i++) {
            const aboveWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
                backgroundColor: this.getWaveColor(i),
            });
    
            const belowWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
                backgroundColor: this.getWaveColor(i),
            });
    
            this.above.push(aboveWave);
            this.below.push(belowWave);
        }
    }

    getWaveColor(index: number): string {
        return this.colormaps === undefined ? '#000000' : this.colormaps(100 / this.amplitude * index / 100);
    }

    createWave(lineNumber: number, editor: TextEditor) {
        this.decorateLine(lineNumber, 0, editor);
    
        for(let i=1; i<this.amplitude; i++) {
            this.decorateLine(lineNumber, -i, editor);
            this.decorateLine(lineNumber, i, editor);
        }
    }
    
    decorateLine(lineNumber: number, offset: number, editor: TextEditor) {
        if(this.center === undefined) {
            return;
        }
    
        const line = editor.document.lineAt(lineNumber + offset);
    
        let waveDecoration = this.center;
        if(offset < 0) {
            waveDecoration = this.above[Math.abs(offset) - 1];
        } else if(offset > 0) {
            waveDecoration = this.below[Math.abs(offset) - 1];
        }
    
        editor.setDecorations(waveDecoration, [line]);
    }
}

export function activate(context: vscode.ExtensionContext) {
    new Wave(context);
}

export function deactivate() {}
