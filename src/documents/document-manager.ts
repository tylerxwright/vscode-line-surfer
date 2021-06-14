import * as vscode from 'vscode';
import { Document } from './document';
import { DocumentScope } from './document-scope';
import { GrammarManager } from './grammar-manager';

export class DocumentManager {
  private readonly documents = new Map<string, Document>();
  private readonly grammarManager = new GrammarManager();

  public getDocumentScope(textEditor: vscode.TextEditor): DocumentScope | undefined {
    const document = this.getDocumentDetails(textEditor.document);
    return document?.getCurrentScope(textEditor.selection);
  }

  public updateAllDocuments(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      this.updateDocument(editor.document);
    }
  }

  private updateDocument(document: vscode.TextDocument): void {
    const documentDecoration = this.getDocumentDetails(document);
    if (documentDecoration) {
      documentDecoration.tokenizeDocument();
    }
  }

  private getDocumentDetails(document: vscode.TextDocument): Document | undefined {
    if (!this.isValidDocument(document)) {
      return;
    }

    const uri = document.uri.toString();
    let documentDetails = this.documents.get(uri);

    if (documentDetails === undefined) {
      const languageConfig = this.tryGetLanguageConfig(document.languageId);
      if (!languageConfig) {
        return;
      }

      if (languageConfig instanceof Promise) {
        languageConfig
          .then((grammar) => {
            if (grammar) {
              this.updateDocument(document);
            }
          })
          .catch((e) => console.error(e));
        return;
      }

      documentDetails = new Document(document, languageConfig, this.grammarManager);
      this.documents.set(uri, documentDetails);
    }
    return documentDetails;
  }

  private tryGetLanguageConfig(languageID: string) {
    return this.grammarManager.tryGetLanguageConfig(languageID);
  }

  private isValidDocument(document?: vscode.TextDocument): boolean {
    if (
      document === undefined ||
      document.lineCount === 0 ||
      document.uri.scheme === 'vscode' ||
      document.uri.scheme === 'output'
    ) {
      return false;
    }

    return true;
  }
}
