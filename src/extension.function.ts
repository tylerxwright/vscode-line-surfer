import * as vscode from 'vscode';
import { DecorationRenderOptions, TextEditor, TextEditorDecorationType, TextEditorSelectionChangeEvent } from 'vscode';
import interpolate from 'color-interpolate';

interface Wave {
    above: TextEditorDecorationType[];
    center?: TextEditorDecorationType;
    below: TextEditorDecorationType[];
    config: {
        colors: string[]
        amplitude: number
    }
    colormap?: (index: number) => string;
}

let wave: Wave;

export function activate(context: vscode.ExtensionContext) {
    initializeWaves();

    let disposable = vscode.commands.registerCommand('line-surfer.surf', () => {
        vscode.window.showInformationMessage('Surfs up!');
        vscode.window.onDidChangeTextEditorSelection((evt: TextEditorSelectionChangeEvent) => createWave(evt.textEditor.selection.active.line, evt.textEditor));
    });

    context.subscriptions.push(disposable);

    if(vscode.window.activeTextEditor !== undefined) {
        createWave(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
    }
}

function initializeWaves() {
    loadWaveConfig();

    const centerWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
        backgroundColor: getWaveColor(0),
        fontWeight: '900',
    });

    wave.center = centerWave;

    for(let i=1; i<wave.config.amplitude; i++) {
        const aboveWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: getWaveColor(i),
        });

        const belowWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: getWaveColor(i),
        });

        wave.above.push(aboveWave);
        wave.below.push(belowWave);
    }
}

function loadWaveConfig() {
    const config = vscode.workspace.getConfiguration('lineSurfer');

    wave = {
        above: [],
        below: [],
        config: {
            colors: [
                config.get('crestColor') as string, 
                config.get('troughColor') as string
            ],
            amplitude: Number(config.get('amplitude'))
        }
    };

    wave.colormap = interpolate(wave.config.colors);
}

function getWaveColor(offset: number): string {
    if(wave.colormap === undefined) {
        return '#222222';
    }

    return wave.colormap(100 / wave.config.amplitude * offset / 100);
}

function reloadWaveConfig() {
    const config = vscode.workspace.getConfiguration('lineSurfer');

    wave.colormap = interpolate([
        config.get('crestColor') as string, 
        config.get('troughColor') as string
    ]),
    wave.config.amplitude = Number(config.get('amplitude'));
}

function createWave(lineNumber: number, editor: TextEditor) {
    reloadWaveConfig();
    decorateLine(lineNumber, 0, editor);

    for(let i=1; i<wave.config.amplitude; i++) {
        decorateLine(lineNumber, -i, editor);
        decorateLine(lineNumber, i, editor);
    }
}

function decorateLine(lineNumber: number, offset: number, editor: TextEditor) {
    if(wave.center === undefined) {
        return;
    }

    const line = editor.document.lineAt(lineNumber + offset);

    let waveDecoration: TextEditorDecorationType = wave.center;
    if(offset < 0) {
        waveDecoration = wave.above[Math.abs(offset) - 1];
    } else if(offset > 0) {
        waveDecoration = wave.below[Math.abs(offset) - 1];
    }

    editor.setDecorations(waveDecoration, [line]);
}

// this method is called when your extension is deactivated
export function deactivate() {}
