import { Position } from 'vscode';
import Bracket from './bracket';
import BracketClose from './bracket-close';
import Token from './token';

interface IBracketManager {
  getPreviousIndex(type: number): number;
  addOpenBracket(token: Token): void;
  GetAmountOfOpenBrackets(type: number): number;
  addCloseBracket(token: Token): void;
  getClosingBracket(position: Position): BracketClose | undefined;
  copyCumulativeState(): IBracketManager;
  getHash(): string;
  offset(startIndex: number, amount: number): void;
  getAllBrackets(): Bracket[];
}

export default IBracketManager;
