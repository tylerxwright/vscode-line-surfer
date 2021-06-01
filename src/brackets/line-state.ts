import { Position } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';
import IBracketManager from './bracket-manager';
import LanguageConfig from './language-config';
import MultipleBracketGroups from './multiple-indexes';
import Settings from './settings';
import SingularBracketGroup from './singular-index';
import Token from './token';

export default class LineState {
  private readonly bracketManager: IBracketManager;
  private previousBracketColor = '';
  private readonly settings: Settings;
  private readonly languageConfig: LanguageConfig;

  constructor(
    settings: Settings,
    languageConfig: LanguageConfig,
    previousState?: {
      readonly colorIndexes: IBracketManager;
      readonly previousBracketColor: string;
    },
  ) {
    this.settings = settings;
    this.languageConfig = languageConfig;

    if (previousState !== undefined) {
      this.bracketManager = previousState.colorIndexes;
      this.previousBracketColor = previousState.previousBracketColor;
    } else {
      this.bracketManager = new SingularBracketGroup(settings);
      this.bracketManager = new MultipleBracketGroups(settings, languageConfig);
    }
  }

  public getBracketHash(): string {
    return this.bracketManager.getHash();
  }

  public cloneState(): LineState {
    const clone = {
      colorIndexes: this.bracketManager.copyCumulativeState(),
      previousBracketColor: this.previousBracketColor,
    };

    return new LineState(this.settings, this.languageConfig, clone);
  }

  public getClosingBracket(position: Position): BracketClose | undefined {
    return this.bracketManager.getClosingBracket(position);
  }

  public offset(startIndex: number, amount: number): void {
    this.bracketManager.offset(startIndex, amount);
  }

  public addBracket(type: number, character: string, beginIndex: number, lineIndex: number, open: boolean): void {
    const token = new Token(type, character, beginIndex, lineIndex);
    if (open) {
      this.addOpenBracket(token);
    } else {
      this.addCloseBracket(token);
    }
  }

  public getAllBrackets(): Bracket[] {
    return this.bracketManager.getAllBrackets();
  }

  private addOpenBracket(token: Token) {
    this.bracketManager.addOpenBracket(token);
  }

  private addCloseBracket(token: Token) {
    this.bracketManager.addCloseBracket(token);
  }
}
