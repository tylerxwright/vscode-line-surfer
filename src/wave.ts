import * as vscode from 'vscode';
import { DecorationRenderOptions, TextEditor, TextEditorDecorationType, TextEditorSelectionChangeEvent } from 'vscode';
import interpolate from 'color-interpolate';

export class Wave {
    private above: TextEditorDecorationType[] = [];
    private below: TextEditorDecorationType[] = [];
    private center?: TextEditorDecorationType;
    private colors: string[] = [];
    private amplitude: number = 3;
    private fontWeight: string = '900';
    
    colormaps?: (index: number) => string;

    constructor() {
        this.reload();

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
    
        if(vscode.window.activeTextEditor !== undefined) {
            this.createWave(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
        }
    }

    private reload() {
        const config = vscode.workspace.getConfiguration('lineSurfer');

        this.reset();
        
        this.colors = [
            config.get('crestColor') as string, 
            config.get('troughColor') as string
        ];

        this.amplitude = Number(config.get('amplitude'));

        this.fontWeight = config.get('fontWeight') as string; 

        this.colormaps = interpolate(this.colors);

        this.initializeWaves();
    }

    reset() {
        this.above.forEach((lineDecoration) => lineDecoration.dispose());
        this.below.forEach((lineDecoration) => lineDecoration.dispose());
        this.center?.dispose();

        this.center = undefined;
        this.above = [];
        this.below = [];
    }

    private initializeWaves() {
        const centerWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: this.getWaveColor(0),
            fontWeight: this.fontWeight,
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

    private getWaveColor(index: number): string {
        return this.colormaps === undefined ? '#000000' : this.colormaps(100 / (this.amplitude - 1 ) * index / 100);
    }

    private createWave(lineNumber: number, editor: TextEditor) {
        this.decorateLine(lineNumber, 0, editor);
    
        for(let i=1; i<this.amplitude; i++) {
            this.decorateLine(lineNumber, -i, editor);
            this.decorateLine(lineNumber, i, editor);
        }
    }
    
    private decorateLine(lineNumber: number, offset: number, editor: TextEditor) {
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