# data/

このディレクトリには日次ダイジェストのデータが入ります。

- `index.json`: 配信済み日付の一覧（マニフェスト）。Web UIが日付リストを取得するために使う。
  形式: `[{"date": "2026-07-06", "count": 10}, ...]`
- `YYYY-MM-DD.json`: 1日分のダイジェスト本体。スキーマは以下の通り。

```json
{
  "date": "2026-07-06",
  "covers_weekend": false,
  "items": [
    {
      "id": "2026-07-06-01",
      "tier": "large",
      "category": "customer",
      "company": "TDK",
      "headline": "見出し",
      "summary": "詳しめの要約",
      "source_name": "情報源名",
      "source_url": "https://...",
      "original_language": "ja"
    }
  ]
}
```

- `category`: `customer`(顧客ニュース) / `industry`(業界全体) / `ai_data`(AI・データ業界)
- `tier`: `large`(大型5本、詳しめ) / `simple`(簡易5本、軽め)
- `original_language`: 翻訳元の言語。英語ソースを日本語要約した場合は `en` を入れ、`summary`は必ず日本語にする
