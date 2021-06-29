import { Position } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';
import IBracketManager from './bracket-manager';
import { GrammarManager } from './grammar-manager';
import LanguageConfig from './language-config';
import MultipleBracketGroups from './multiple-indexes';
import SingularBracketGroup from './singular-index';
import Token from './token';

export default class LineState {
  private readonly bracketManager: IBracketManager;
  private previousBracketColor = '';
  private readonly grammarManager: GrammarManager;
  private readonly languageConfig: LanguageConfig;

  constructor(
    grammarManager: GrammarManager,
    languageConfig: LanguageConfig,
    previousState?: {
      readonly colorIndexes: IBracketManager;
      readonly previousBracketColor: string;
    },
  ) {
    this.grammarManager = grammarManager;
    this.languageConfig = languageConfig;

    if (previousState !== undefined) {
      this.bracketManager = previousState.colorIndexes;
      this.previousBracketColor = previousState.previousBracketColor;
    } else {
      this.bracketManager = new SingularBracketGroup(grammarManager);
      this.bracketManager = new MultipleBracketGroups(grammarManager, languageConfig);
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

    return new LineState(this.grammarManager, this.languageConfig, clone);
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
