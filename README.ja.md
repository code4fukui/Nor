# Nor - 演算子が1つしかないプログラミング言語

Norは、演算子として「nor」のみサポートする構造化プログラミング言語です。

## デモ

- ブラウザで動作する実行環境 [Nor Playground](https://code4fukui.github.io/Nor/)
- HTMLへの組み込み例 [Nor on web](https://code4fukui.github.io/Nor/norweb.html)

## 機能

- 変数、配列、条件分岐、繰り返し、関数の定義と呼び出しなどの基本的な構造化プログラミング機能を提供します。
- 演算子は「nor」のみをサポートしています。
- Nor言語のソースコードをJavaScriptのコードに変換し、実行することができます。

## 使い方

- CLIからの実行例: [examples/add.nor](examples/add.nor)
```sh
deno -A https://code4fukui.github.io/Nor/cli.js examples/add.nor
```
- デバッグ用アプリ [nor2js](https://code4fukui.github.io/Nor/nor2js.html)