# Nor - 演算子が1つしかないプログラミング言語

Norは、演算子として「nor」のみをサポートする構造化プログラミング言語です。

## デモ
[Nor Playground](https://code4fukui.github.io/Nor/) - ウェブ上の実行環境  
[Nor on web](https://code4fukui.github.io/Nor/norweb.html) - HTMLへの組み込み例

## 特徴
- 演算子は「nor」のみ
- 変数、配列、条件分岐、ループ、関数をサポート
- ウェブブラウザまたはコマンドラインで実行可能
- デバッグ用アプリを同梱: [nor2js](https://code4fukui.github.io/Nor/nor2js.html)

## 必要条件
特にありません。Norはウェブ上またはDenoランタイムで実行可能です。

## 使い方
ウェブ上でNorを実行するには、web.jsスクリプトを読み込み、`<script type="text/nor">`ブロックを追加します:

```html
<script type="module" src="https://code4fukui.github.io/Nor/web.js"></script>
<script type="text/nor">
print 1 nor 0
</script>
```

Denoを使用してコマンドラインでNorを実行するには:

```sh
deno -A https://code4fukui.github.io/Nor/cli.js examples/add.nor
```

## ライセンス
Norはオープンソースプロジェクトです。ライセンスは指定されていません。
