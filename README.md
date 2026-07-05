# ニュース配信アプリ

Tableau SE向けに、毎朝8時（平日）担当顧客とデータ分析/AI業界のニュースをまとめて届ける個人用ツール。

## アーキテクチャ

配信は「schedule → 収集 → 要約 → 配信」のシンプルな流れで、**永続ストレージ（DB・git書き込み）を持たない**。
生成したダイジェストはその場でメールとntfyに流し込む。

```
Routine（claude.ai/code/routines・クラウド・平日8時JST）
  1. リポジトリの config.yaml を読む（読み取りのみ）
  2. WebSearch でニュース収集・要約（検索回数・処理時間に上限あり）
  3. フルのダイジェストを Gmail で shimakaho@gmail.com にHTMLメール送信
  4. ntfy で短いプッシュ通知（大型5本の見出しのみ）
```

- **読む場所**: メール（Gmailに自動アーカイブ・検索可能）
- **通知**: ntfyプッシュ（トピック: `shimakaho-news-digest-4bacfa55f320`）
- **GitHubへの書き込みはしない**: クラウドRoutineのGitHub App権限では書き込みが403で拒否されるため、
  配信はメール+ntfyに寄せている。`config.yaml` の読み取りは書き込み権限なしでも動く。

## 構成ファイル

- `config.yaml`: ウォッチ対象企業・業界・情報源優先順位・除外条件。会話でClaudeに伝えるだけで編集できる
- `ROUTINE_PROMPT.md`: 毎朝のニュース収集・配信を行うRoutineのプロンプト正本（＋必要な設定）
- `docs/`, `data/`: **旧Web UI配信方式の名残（現在は未使用）**。メール配信に移行したため、いずれ削除予定

## 使い方

- **毎朝の配信**: Routineが平日8時(JST)に自動実行され、メールとntfyでダイジェストが届く
- **ウォッチ対象を変えたい時**: 書き込み権限を持つローカルのClaude Code（または手元のgit操作）で
  `config.yaml` を編集してpushする。会話で「TDKは外してキオクシア追加して」のように伝えれば更新できる

## セットアップ状況・課題

- claude.ai と GitHub の連携は「認可(OAuth)」はできているが、リポジトリへの「インストール(書き込み権限)」が
  行われておらず、クラウドRoutineからのpushが `403 Resource not accessible by integration` になる。
  この根本解決にはAnthropicサポートへの問い合わせが必要。現アーキテクチャはこれを回避する設計。
