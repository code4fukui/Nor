# Nor - 演算子が1つしかないプログラミング言語

Norは、演算子として「nor」のみをサポートする構造化プログラミング言語です。Nor言語のソースファイルは「.nor」拡張子を持ち、MIMEタイプは「text/nor」となります。

## デモ
- ブラウザ上で実行できる Nor Playground: [https://code4fukui.github.io/Nor/](https://code4fukui.github.io/Nor/)
- HTML内に組み込む例: [https://code4fukui.github.io/Nor/norweb.html](https://code4fukui.github.io/Nor/norweb.html)

## 機能
- 変数、配列、条件分岐、繰り返し、関数定義などの基本的な構造化プログラミング機能を提供
- 演算子は「nor」のみをサポート
- Nor言語のソースコードをJavaScriptのコードに変換し実行できるデバッグツール「nor2js」を提供

## 使い方
- CLI(Deno)から実行する例: [examples/add.nor](examples/add.nor)
```sh
deno -A https://code4fukui.github.io/Nor/cli.js examples/add.nor
```

## ライセンス
Norは オープンソースプロジェクトですが、ライセンスは明確に指定されていません。