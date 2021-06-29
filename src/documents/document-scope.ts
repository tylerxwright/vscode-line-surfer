import { Range, TextDocument } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';

export class DocumentScope {
  private document: TextDocument;
  private openBracket: Bracket;
  private closeBracket: BracketClose;

  constructor(document: TextDocument, closeBracket: BracketClose) {
    this.document = document;
    this.openBracket = closeBracket.openBracket;
    this.closeBracket = closeBracket;
  }

  public get beginRange(): Range {
    return this.closeBracket.token.range;
  }

  public get endRange(): Range {
    return this.closeBracket.token.range;
  }

  public get startLineIndex(): number {
    return this.openBracket.token.range.start.line;
  }

  public get endLineIndex(): number {
    return this.closeBracket.token.range.start.line;
  }

  public get lastWhiteSpaceCharacterIndex(): number {
    return this.document.lineAt(this.endRange.start).firstNonWhitespaceCharacterIndex;
  }

  public get lastBracketStartIndex(): number {
    return this.endRange.start.character;
  }

  public get lastBracketIsFirstCharacterOnLine(): boolean {
    return this.lastWhiteSpaceCharacterIndex === this.lastBracketStartIndex;
  }
}
