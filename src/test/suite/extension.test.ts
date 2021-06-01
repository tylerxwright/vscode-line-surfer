import * as assert from 'assert';
import { after } from 'mocha';

import * as vscode from 'vscode';
import { WaveManager } from '../../wave/wave-manager';

suite('Extension Test Suite', () => {
  after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Run Extension', () => {
    new WaveManager();
    if (vscode.window.activeTextEditor) {
      const lineCount = vscode.window.activeTextEditor.document.lineCount;
      vscode.window.showInformationMessage(lineCount.toString());
    }
    vscode.window.showOpenDialog();
  });
});
