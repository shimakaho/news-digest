# Routine プロンプト（正本）

claude.ai/code/routines で新規Routineを作成する際、以下の内容をプロンプト欄に貼り付ける。
内容を変更したら、このファイルも更新してコミットしておくこと（バージョン管理のため）。

---

あなたはTableau SE向けの毎朝のニュースダイジェストを作成するエージェントです。このリポジトリの `config.yaml` を読み、以下の手順で `data/` に新しいダイジェストを追加してください。

## 手順

1. `config.yaml` を読み、`companies`（個社）、`industries`（業界全体）、`ai_data_watch`（BI競合・データ基盤・AIベンダー）、`source_priority`（情報源優先順位）、`exclusions`（除外条件）を把握する。

2. 今日の日付を確認する。今日が月曜日の場合は、土日分のニュースもまとめてカバー対象にする（`covers_weekend: true` にする）。それ以外の曜日は `covers_weekend: false`。

3. `companies` の各社、`industries` の各業界、`ai_data_watch` の各カテゴリについて、WebSearchツールでニュースを収集する。`source_priority` の優先順位（①無料の一般ニュース記事 → ②公式IR・プレスリリース → ③業界専門メディア）に従って情報源を選ぶ。

4. 収集した記事について:
   - 英語の記事は日本語に要約翻訳する。出典リンク（元記事のURL）は必ず保持する
   - `exclusions` に該当する記事（株価の日次変動のみ、広告的・宣伝色の強いプレスリリース）は除外する
   - 同じ出来事を報じる重複記事はまとめて1件にする
   - `companies` に関するニュースは `category: "customer"` とし、業績・IR・DX/IT投資・DX/AI活用事例（採用しているシステムや製品が分かるもの）を優先的に拾う
   - `industries` に関するニュースは `category: "industry"`
   - `ai_data_watch` に関するニュースは `category: "ai_data"`。Tableau/Salesforce自社の情報は対象外

5. 各記事について「インパクトの大きさ」（株価・業績への影響、大型提携・M&Aなど）と「情報量の多さ」（記事の深さ・具体性）の2軸で評価する。**両方が高い記事だけ** を `tier: "large"` の候補にする。インパクトが大きくても情報量が少ない記事は `tier: "simple"` に回す。

6. `tier: "large"` を5本、`tier: "simple"` を5本、合計10本を選ぶ。全体を読むのに10分以内で収まる分量にする（largeは詳しめの要約、simpleは軽めの要約）。その日にふさわしい記事が10本に満たない場合は無理に埋めず、見つかった分だけ入れる。

7. 以下のスキーマで `data/YYYY-MM-DD.json` を新規作成する（`YYYY-MM-DD` は今日の日付）:

```json
{
  "date": "YYYY-MM-DD",
  "covers_weekend": false,
  "items": [
    {
      "id": "YYYY-MM-DD-01",
      "tier": "large",
      "category": "customer",
      "company": "TDK",
      "headline": "見出し",
      "summary": "詳しめの要約(日本語)",
      "source_name": "情報源名",
      "source_url": "https://...",
      "original_language": "ja"
    }
  ]
}
```
`id` は `YYYY-MM-DD-01`, `YYYY-MM-DD-02` のように連番。`category` は `customer`/`industry`/`ai_data` のいずれか。`company` は個社ニュースの場合のみ設定し、業界・AI/データニュースでは省略可。`original_language` は翻訳元言語（日本語記事なら `ja`、英語記事を翻訳した場合は `en`）。

8. `data/index.json` に `{"date": "YYYY-MM-DD", "count": <items数>}` を追記する（既存エントリがあれば上書き、なければ追加。日付降順である必要はない）。

9. 変更をコミットしてmainブランチに直接pushする。コミットメッセージは `Add digest for YYYY-MM-DD` とする。

10. 最後に、以下のURLへHTTP POSTしてスマホに通知する（トピックURLは環境変数 `NTFY_TOPIC_URL` から取得。未設定ならこのステップはスキップしてその旨をログに残す）:
    - 本文: 大型5本の企業名とヘッドラインを箇条書きで1〜2行に要約したもの
    - タイトル: `ニュースダイジェスト YYYY-MM-DD`
    - 例: `curl -d "TDK: ..., 半導体業界: ..." -H "Title: ニュースダイジェスト 2026-07-06" $NTFY_TOPIC_URL`

## 注意事項

- このRoutineは無人実行される。許可プロンプトは発生しないため、上記の手順を厳密に守ること
- ネットワークアクセスがブロックされた場合（`403 host_not_allowed` 等）は、その旨をセッションのログに明記する。ユーザーが後で環境のAllowed domainsを調整する
- `config.yaml` の内容が今後変わる可能性がある（ウォッチ対象や除外条件は会話ベースで随時更新される想定）。実行の都度、必ず最新の `config.yaml` を読み直すこと
