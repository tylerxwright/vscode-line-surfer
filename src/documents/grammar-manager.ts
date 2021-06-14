import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getRegexForBrackets } from './bracket-util';
import { IExtensionPackage, IGrammar } from './extension-grammar';
import LanguageConfig from './language-config';

export class GrammarManager {
  private readonly scopeNameToLanguage = new Map<string, string>();
  private readonly scopeNameToPath = new Map<string, string>();
  private readonly languageToScopeName = new Map<string, string>();
  private readonly languageToConfigPath = new Map<string, string>();
  private languageId = 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly vsctm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly oniguruma: any;
  private readonly languageConfigs = new Map<string, LanguageConfig>();

  constructor() {
    try {
      this.initializeGrammars();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.vsctm = require('vscode-textmate');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.oniguruma = require('vscode-oniguruma');
    } catch (e) {
      console.log(e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public tryGetLanguageConfig(languageID: string): any {
    const existingTokenizer = this.languageConfigs.get(languageID);
    if (existingTokenizer) {
      return existingTokenizer;
    }

    const scopeName = this.languageToScopeName.get(languageID);

    if (!scopeName) {
      return;
    }

    const configPath = this.languageToConfigPath.get(languageID);
    if (!configPath) {
      return;
    }

    return new Promise((resolve, reject) => {
      fs.readFile(configPath, (error, content) => {
        if (error) {
          reject(error);
        } else {
          const config = JSON.parse(content.toString());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const brackets = (config as any).brackets as [string[]];
          resolve(brackets);
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).then(async (brackets: any) => {
      if (!brackets) {
        return null;
      }

      const vscodeOnigurumaLib = await this.loadOnigruma();
      const registry = new this.vsctm.Registry({
        // tslint:disable-next-line:object-literal-shorthand
        onigLib: vscodeOnigurumaLib,
        loadGrammar: (scopeName: string) => {
          const path = this.scopeNameToPath.get(scopeName);
          console.log(path);
          if (!path) {
            return new Promise((resolve) => {
              resolve(null);
            });
          }

          return new Promise((resolve, reject) => {
            fs.readFile(path, (error, content) => {
              if (error) {
                reject(error);
              } else {
                const text = content.toString();
                const rawGrammar = this.vsctm.parseRawGrammar(text, path);
                resolve(rawGrammar);
              }
            });
          });
        },
      });

      // Load the JavaScript grammar and any other grammars included by it async.
      return (
        registry.loadGrammarWithConfiguration(scopeName, this.languageId++, {}) as Thenable<IGrammar | undefined | null>
      ).then((grammar) => {
        if (grammar) {
          if (!this.languageConfigs.has(languageID)) {
            const mappedBrackets = brackets
              .map((b) => ({ open: b[0], close: b[1] }))
              .filter((e) => e.open !== '<' && e.close !== '>');

            if (mappedBrackets.length === 0) {
              return new Promise((resolve) => {
                resolve(null);
              });
            }

            const bracketToId = new Map<string, { open: boolean; key: number }>();
            for (let i = 0; i < brackets.length; i++) {
              const bracket = brackets[i];
              bracketToId.set(bracket[0], { open: true, key: i });
              bracketToId.set(bracket[1], { open: false, key: i });
            }

            let maxBracketLength = 0;
            for (const bracket of mappedBrackets) {
              maxBracketLength = Math.max(maxBracketLength, bracket.open.length);
              maxBracketLength = Math.max(maxBracketLength, bracket.close.length);
            }

            const regex = getRegexForBrackets(mappedBrackets);
            this.languageConfigs.set(languageID, new LanguageConfig(grammar, regex, bracketToId));
          }
        }
        return new Promise((resolve) => {
          resolve(grammar);
        });
      });
    });
  }

  private async loadOnigruma() {
    const wasmBin = fs.readFileSync(path.join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
    const vscodeOnigurumaLib = this.oniguruma.loadWASM(wasmBin).then(() => {
      return {
        createOnigScanner: (sources: string[]) => new this.oniguruma.OnigScanner(sources),
        createOnigString: (str: string) => new this.oniguruma.OnigString(str),
      };
    });

    return vscodeOnigurumaLib;
  }

  private initializeGrammars() {
    for (const extension of vscode.extensions.all) {
      const packageJSON = extension.packageJSON as IExtensionPackage;
      if (packageJSON.contributes) {
        if (packageJSON.contributes.grammars && packageJSON.contributes.languages) {
          for (const grammar of packageJSON.contributes.grammars) {
            if (grammar.language && grammar.scopeName && grammar.path) {
              const fullPath = path.join(extension.extensionPath, grammar.path);
              this.languageToScopeName.set(grammar.language, grammar.scopeName);
              this.scopeNameToPath.set(grammar.scopeName, fullPath);
              this.scopeNameToLanguage.set(grammar.scopeName, grammar.language);
            }
          }

          for (const language of packageJSON.contributes.languages) {
            if (language.configuration) {
              const configPath = path.join(extension.extensionPath, language.configuration);
              this.languageToConfigPath.set(language.id, configPath);
            }
          }
        }
      }
    }
  }
}
