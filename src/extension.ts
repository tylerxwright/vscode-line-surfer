import * as vscode from 'vscode';
import { DecorationRenderOptions, TextEditor, TextEditorDecorationType, TextEditorSelectionChangeEvent } from 'vscode';
import * as interpolate from 'color-interpolate';

interface Wave {
    above: TextEditorDecorationType[];
    center: TextEditorDecorationType;
    below: TextEditorDecorationType[];
}

let wave: Wave;
const colormap = interpolate(['#76398', '#872909']);
const waveColorBase = 5;
const waveOpacity = 1;
const waveFontWeight = 900;
const waveHeight = 4;
const waveModifier = 20;

export function activate(context: vscode.ExtensionContext) {
    initializeWaves(waveHeight);

    let disposable = vscode.commands.registerCommand('line-surfer.surf', () => {
        vscode.window.showInformationMessage('Surfs up!');
        vscode.window.onDidChangeTextEditorSelection((evt: TextEditorSelectionChangeEvent) => createWave(evt.textEditor.selection.active.line, evt.textEditor));
    });

    context.subscriptions.push(disposable);

    if(vscode.window.activeTextEditor !== undefined) {
        createWave(vscode.window.activeTextEditor.selection.active.line, vscode.window.activeTextEditor);
    }
}

function initializeWaves(numberOfWaves: number) {
    const centerWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
        backgroundColor: getWaveColor(0),
        opacity: waveOpacity.toString(),
        fontWeight: waveFontWeight.toString(),
    });

    wave = {
        above: [],
        center: centerWave,
        below: []
    }

    for(let i=1; i<numberOfWaves; i++) {
        const aboveWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: getWaveColor(i),
            opacity: waveOpacity.toString(),
        });

        const belowWave = vscode.window.createTextEditorDecorationType(<DecorationRenderOptions> {
            backgroundColor: getWaveColor(i),
            opacity: waveOpacity.toString(),
        });

        wave.above.push(aboveWave);
        wave.below.push(belowWave);
    }
}

function getWaveColor(offset: number): string {
    const colorValue = (waveColorBase - offset) * waveModifier;
    return rgbToHex(colorValue, colorValue, colorValue);
}

function componentToHex(c: number): string {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function createWave(lineNumber: number, editor: TextEditor) {
    decorateLine(lineNumber, 0, editor);

    for(let i=1; i<waveHeight; i++) {
        decorateLine(lineNumber, -i, editor);
        decorateLine(lineNumber, i, editor);
    }
}

function decorateLine(lineNumber: number, offset: number, editor: TextEditor) {
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
