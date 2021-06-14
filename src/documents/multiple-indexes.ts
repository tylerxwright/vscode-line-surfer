import { Position, Range } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';
import IBracketManager from './bracket-manager';
import { GrammarManager } from './grammar-manager';
import LanguageConfig from './language-config';
import Token from './token';

export default class MultipleBracketGroups implements IBracketManager {
  private allLinesOpenBracketStack: Bracket[][] = [];
  private allBracketsOnLine: Bracket[] = [];
  private bracketsHash = '';
  private previousOpenBracketColorIndexes: number[] = [];
  private readonly grammarManager: GrammarManager;
  private readonly languageConfig: LanguageConfig;

  constructor(
    grammarManager: GrammarManager,
    languageConfig: LanguageConfig,
    previousState?: {
      currentOpenBracketColorIndexes: Bracket[][];
      previousOpenBracketColorIndexes: number[];
    },
  ) {
    this.grammarManager = grammarManager;
    this.languageConfig = languageConfig;
    if (previousState !== undefined) {
      this.allLinesOpenBracketStack = previousState.currentOpenBracketColorIndexes;
      this.previousOpenBracketColorIndexes = previousState.previousOpenBracketColorIndexes;
    } else {
      for (const value of languageConfig.bracketToId.values()) {
        this.allLinesOpenBracketStack[value.key] = [];
        this.previousOpenBracketColorIndexes[value.key] = 0;
      }
    }
  }

  public getPreviousIndex(type: number): number {
    return this.previousOpenBracketColorIndexes[type];
  }

  public addOpenBracket(token: Token): void {
    const openBracket = new Bracket(token);
    this.allBracketsOnLine.push(openBracket);
    this.bracketsHash += openBracket.token.character;

    this.allLinesOpenBracketStack[token.type].push(openBracket);
  }

  public GetAmountOfOpenBrackets(type: number): number {
    return this.allLinesOpenBracketStack[type].length;
  }

  public addCloseBracket(token: Token): number | undefined {
    const openStack = this.allLinesOpenBracketStack[token.type];

    if (openStack.length > 0) {
      if (openStack[openStack.length - 1].token.type === token.type) {
        const openBracket = openStack.pop();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const closeBracket = new BracketClose(token, openBracket!);
        this.allBracketsOnLine.push(closeBracket);
        this.bracketsHash += closeBracket.token.character;
        return undefined;
      }
      return undefined;
    }

    const orphan = new Bracket(token);
    this.allBracketsOnLine.push(orphan);
    this.bracketsHash += orphan.token.character;
    return undefined;
  }

  public getClosingBracket(position: Position): BracketClose | undefined {
    for (const bracket of this.allBracketsOnLine) {
      if (!(bracket instanceof BracketClose)) {
        continue;
      }

      const closeBracket = bracket as BracketClose;
      const openBracket = closeBracket.openBracket;
      const range = new Range(
        openBracket.token.range.start.translate(0, 1),
        closeBracket.token.range.end.translate(0, -1),
      );

      if (range.contains(position)) {
        return closeBracket;
      }
    }
    return undefined;
  }

  public getAllBrackets(): Bracket[] {
    return this.allBracketsOnLine;
  }

  public getHash(): string {
    return this.bracketsHash;
  }

  public offset(startIndex: number, amount: number): void {
    for (const bracket of this.allBracketsOnLine) {
      if (bracket.token.range.start.character >= startIndex) {
        bracket.token.offset(amount);
      }
    }
  }

  public copyCumulativeState(): IBracketManager {
    const clone: Bracket[][] = [];

    for (const value of this.allLinesOpenBracketStack) {
      clone.push(value.slice());
    }

    return new MultipleBracketGroups(this.grammarManager, this.languageConfig, {
      currentOpenBracketColorIndexes: clone,
      previousOpenBracketColorIndexes: this.previousOpenBracketColorIndexes.slice(),
    });
  }
}
