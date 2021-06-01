import * as vscode from 'vscode';
//import Bracket from './bracket';
import BracketClose from './bracket-close';
import { IStackElement } from './extension-grammer';
import LanguageConfig from './language-config';
import LineState from './line-state';
import Settings from './settings';
import TextLine from './text-line';
import { ignoreBracketsInToken, LineTokens } from './vscode-files';
import { TextDocumentContentChangeEvent } from 'vscode';

export default class DocumentDecoration {
  public readonly settings: Settings;

  // This program caches lines, and will only analyze linenumbers including or above a modified line
  private lines: TextLine[] = [];
  private readonly document: vscode.TextDocument;
  private readonly languageConfig: LanguageConfig;
  private scopeSelectionHistory: vscode.Selection[][] = [];

  constructor(document: vscode.TextDocument, config: LanguageConfig, settings: Settings) {
    this.settings = settings;
    this.document = document;
    this.languageConfig = config;
  }

  public onDidChangeTextDocument(contentChanges: ReadonlyArray<TextDocumentContentChangeEvent>): void {
    if (contentChanges.length > 1 || !contentChanges[0].range.isSingleLine || contentChanges[0].text.length > 1) {
      let minLineIndexToUpdate = 0;
      for (const contentChange of contentChanges) {
        minLineIndexToUpdate = Math.min(minLineIndexToUpdate, contentChange.range.start.line);
      }

      if (minLineIndexToUpdate === 0) {
        this.lines = [];
      } else {
        this.lines.splice(minLineIndexToUpdate);
      }
      this.tokenizeDocument();
      return;
    }

    const change = contentChanges[0];

    const lineNumber = change.range.start.line;
    // Parse overlapped lines with goal to see if we can avoid document reparse
    // By just moving existing brackets if the amount of brackets on a line didn't change
    const newLine = this.tokenizeLine(lineNumber);
    const currentLine = this.lines[lineNumber];

    // Current line has new brackets which need to be colored
    if (
      !currentLine.getRuleStack().equals(newLine.getRuleStack()) ||
      currentLine.getBracketHash() !== newLine.getBracketHash()
    ) {
      this.lines[lineNumber] = newLine;
      this.lines.splice(lineNumber + 1);
      this.tokenizeDocument();
      return;
    }

    const charOffset = change.text.length - change.rangeLength;
    currentLine.offset(change.range.start.character, charOffset);
    return;
  }

  public expandBracketSelection(editor: vscode.TextEditor): void {
    const newSelections: vscode.Selection[] = [];

    editor.selections.forEach((selection) => {
      if (this.scopeSelectionHistory.length === 0) {
        this.scopeSelectionHistory.push(editor.selections);
      }

      const nextPos = this.document.validatePosition(selection.active.translate(0, 1));
      const endBracket = this.searchScopeForwards(nextPos);
      if (!endBracket) {
        return;
      }

      const start = endBracket.openBracket.token.range.start.translate(0, 1);
      const end = endBracket.token.range.end.translate(0, -1);
      newSelections.push(new vscode.Selection(start, end));
    });

    if (newSelections.length > 0) {
      this.scopeSelectionHistory.push(newSelections);

      editor.selections = newSelections;
    }
    return;
  }

  public undoBracketSelection(editor: vscode.TextEditor): void {
    this.scopeSelectionHistory.pop();

    if (this.scopeSelectionHistory.length === 0) {
      return;
    }

    const scopes = this.scopeSelectionHistory[this.scopeSelectionHistory.length - 1];
    editor.selections = scopes;
    return;
  }

  // Lines are stored in an array, if line is requested outside of array bounds
  // add emptys lines until array is correctly sized
  public getLine(index: number, state: IStackElement): TextLine {
    if (index < this.lines.length) {
      return this.lines[index];
    } else {
      if (this.lines.length === 0) {
        this.lines.push(new TextLine(state, new LineState(this.settings, this.languageConfig), 0));
      }

      if (index < this.lines.length) {
        return this.lines[index];
      }

      if (index === this.lines.length) {
        const previousLine = this.lines[this.lines.length - 1];
        const newLine = new TextLine(state, previousLine.cloneState(), index);

        this.lines.push(newLine);
        return newLine;
      }

      throw new Error('Cannot look more than one line ahead');
    }
  }

  public tokenizeDocument(): void {
    // console.log("Tokenizing " + this.document.fileName);

    // One document may be shared by multiple editors (side by side view)
    const editors: vscode.TextEditor[] = vscode.window.visibleTextEditors.filter((e) => this.document === e.document);

    if (editors.length === 0) {
      console.warn('No editors associated with document: ' + this.document.fileName);
      return;
    }

    // console.time("tokenizeDocument");

    const lineIndex = this.lines.length;
    const lineCount = this.document.lineCount;
    if (lineIndex < lineCount) {
      // console.log("Reparse from line: " + (lineIndex + 1));
      for (let i = lineIndex; i < lineCount; i++) {
        const newLine = this.tokenizeLine(i);
        this.lines.push(newLine);
      }
    }

    // console.timeEnd("tokenizeDocument");
    return;
  }

  public updateScopeDecorations(event: vscode.TextEditorSelectionChangeEvent): void {
    // console.time("updateScopeDecorations");

    // For performance reasons we only do one selection for now.
    // Simply wrap in foreach selection for multicursor, maybe put it behind an option?
    const selection = event.textEditor.selection;

    const closeBracket = this.searchScopeForwards(selection.active);
    if (!closeBracket) {
      return;
    }

    // const openBracket = closeBracket.openBracket;
    // const beginRange = openBracket.token.range;
    // const endRange = closeBracket.token.range;
    // const startLineIndex = openBracket.token.range.start.line;
    // const endLineIndex = closeBracket.token.range.start.line;

    // const lastWhiteSpaceCharacterIndex = this.document.lineAt(endRange.start).firstNonWhitespaceCharacterIndex;
    // const lastBracketStartIndex = endRange.start.character;
    // const lastBracketIsFirstCharacterOnLine = lastWhiteSpaceCharacterIndex === lastBracketStartIndex;

    // const start = beginRange.start.line + 1;
    // const end = endRange.start.line;

    // console.timeEnd("updateScopeDecorations");
    return;
  }

  private tokenizeLine(index: number) {
    const newText = this.document.lineAt(index).text;
    const previousLineRuleStack = index > 0 ? this.lines[index - 1].getRuleStack() : undefined;

    const previousLineState =
      index > 0 ? this.lines[index - 1].cloneState() : new LineState(this.settings, this.languageConfig);

    const tokenized = this.languageConfig.grammar.tokenizeLine2(newText, previousLineRuleStack);
    const tokens = tokenized.tokens;
    const lineTokens = new LineTokens(tokens, newText);

    const matches = new Array<{ content: string; index: number }>();
    const count = lineTokens.getCount();
    for (let i = 0; i < count; i++) {
      const tokenType = lineTokens.getStandardTokenType(i);
      if (!ignoreBracketsInToken(tokenType)) {
        const searchStartOffset = tokens[i * 2];
        const searchEndOffset = i < count ? tokens[(i + 1) * 2] : newText.length;

        const currentTokenText = newText.substring(searchStartOffset, searchEndOffset);

        let result: RegExpExecArray | null;
        // tslint:disable-next-line:no-conditional-assignment
        while ((result = this.languageConfig.regex.exec(currentTokenText)) !== null) {
          matches.push({ content: result[0], index: result.index + searchStartOffset });
        }
      }
    }

    const newLine = new TextLine(tokenized.ruleStack, previousLineState, index);
    for (const match of matches) {
      const lookup = this.languageConfig.bracketToId.get(match.content);
      if (lookup) {
        newLine.AddToken(match.content, match.index, lookup.key, lookup.open);
      }
    }
    return newLine;
  }

  private searchScopeForwards(position: vscode.Position): BracketClose | undefined | void {
    for (let i = position.line; i < this.lines.length; i++) {
      const endBracket = this.lines[i].getClosingBracket(position);

      if (endBracket) {
        return endBracket;
      }
    }
  }
}
