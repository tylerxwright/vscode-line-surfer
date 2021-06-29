import * as vscode from 'vscode';
import TextMateLoader from './textmate-loader';

export default class Settings {
  public readonly TextMateLoader;
  public readonly contextualParsing = false;
  public readonly regexNonExact: RegExp | undefined;
  public readonly timeOutLength = 1000;
  public readonly excludedLanguages: Set<string>;
  public isDisposed = false;

  constructor() {
    this.TextMateLoader = new TextMateLoader();
    const configuration = vscode.workspace.getConfiguration('lineSurfer', undefined);
    const excludedLanguages = configuration.get('excludedLanguages') as string[];

    if (!Array.isArray(excludedLanguages)) {
      throw new Error('excludedLanguages is not an array');
    }

    this.excludedLanguages = new Set(excludedLanguages);
  }

  public dispose(): void {
    if (!this.isDisposed) {
      this.isDisposed = true;
    }
  }
}
