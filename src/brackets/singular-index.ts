import { Position, Range } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';
import IBracketManager from './bracket-manager';
import Settings from './settings';
import Token from './token';

export default class SingularBracketGroup implements IBracketManager {
  private allLinesOpenBracketStack: Bracket[] = [];
  private allBracketsOnLine: Bracket[] = [];
  private bracketsHash = '';
  private previousOpenBracketColorIndex = -1;
  private readonly settings: Settings;

  constructor(
    settings: Settings,
    previousState?: {
      currentOpenBracketColorIndexes: Bracket[];
      previousOpenBracketColorIndex: number;
    },
  ) {
    this.settings = settings;

    if (previousState !== undefined) {
      this.allLinesOpenBracketStack = previousState.currentOpenBracketColorIndexes;
      this.previousOpenBracketColorIndex = previousState.previousOpenBracketColorIndex;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getPreviousIndex(_type: number): number {
    return this.previousOpenBracketColorIndex;
  }

  public getAllBrackets(): Bracket[] {
    return this.allBracketsOnLine;
  }

  public addOpenBracket(token: Token): void {
    const openBracket = new Bracket(token);
    this.allLinesOpenBracketStack.push(openBracket);
    this.allBracketsOnLine.push(openBracket);
    this.bracketsHash += openBracket.token.character;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public GetAmountOfOpenBrackets(_type: number): number {
    return this.allLinesOpenBracketStack.length;
  }

  public addCloseBracket(token: Token): void {
    if (this.allLinesOpenBracketStack.length > 0) {
      if (this.allLinesOpenBracketStack[this.allLinesOpenBracketStack.length - 1].token.type === token.type) {
        const openBracket = this.allLinesOpenBracketStack.pop();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const closeBracket = new BracketClose(token, openBracket!);
        this.allBracketsOnLine.push(closeBracket);
        this.bracketsHash += closeBracket.token.character;
        return;
      }
    }

    const orphan = new Bracket(token);
    this.allBracketsOnLine.push(orphan);
    this.bracketsHash += orphan.token.character;
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

    return;
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

  public copyCumulativeState(): SingularBracketGroup {
    return new SingularBracketGroup(this.settings, {
      currentOpenBracketColorIndexes: this.allLinesOpenBracketStack.slice(),
      previousOpenBracketColorIndex: this.previousOpenBracketColorIndex,
    });
  }
}
