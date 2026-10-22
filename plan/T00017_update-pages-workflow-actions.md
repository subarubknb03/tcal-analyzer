# T00017 GitHub Pages デプロイワークフローのアクション更新

## 背景・目的

直近の CI 実行（run 26164448388, 2026-05-20）で以下の警告が出ている。

> Node.js 20 actions are deprecated ... Actions will be forced to run with Node.js 24
> by default starting June 2nd, 2026. Node.js 20 will be removed from the runner on
> September 16th, 2026.

現在（2026-10-22）はランナーから Node.js 20 が削除済みで、`@v4` 系アクションは
Node.js 24 で強制実行されている状態。動作保証外のため、Node.js 24 ランタイム対応の
最新メジャーへ更新し、GitHub Pages への公開が確実に動くようにする。

あわせて T00016 で行った `node-version: 24` / `check-latest: true`（eMudhra CA 対策）を維持する。

## 更新内容

| アクション | 現在 | 更新後 | ランタイム | 破壊的変更の影響 |
|---|---|---|---|---|
| `actions/checkout` | v4 | v7 | node24 | なし（ランナー v2.327.1 以上が必要だが GitHub ホストランナーは満たす） |
| `actions/setup-node` | v4 | v7 | node24 | v5 で `packageManager` 指定時の自動キャッシュが追加。本リポジトリは `packageManager` 未指定かつ `cache: npm` を明示しているため影響なし |
| `actions/upload-pages-artifact` | v3 | v5 | composite | v4 でドットファイルを除外。`docs/` 出力にドットファイルはないため影響なし |
| `actions/configure-pages` | v4 | v6 | node24 | v5 の破壊的変更は `static_site_generator: next` のみ。未使用のため影響なし |
| `actions/deploy-pages` | v4 | v5 | node24 | 必要権限は `pages: write` / `id-token: write` で現状どおり |

## その他

- `npm run build` の出力先 `docs/` がローカルで untracked になるため `.gitignore` に追加する
  （公開は CI でビルドした成果物をアップロードしており、`docs/` のコミットは不要）。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `.github/workflows/deploy.yml` | 各アクションのメジャーバージョン更新 |
| `.gitignore` | `docs/` を追加 |

## 検証

1. Node 24 で `npm ci && npm run build` が成功すること（コンテナ内で確認済み）
2. develop → main の PR で `build` ジョブが成功し、Node.js 20 非推奨の警告が消えていること
3. main マージ後に `deploy` ジョブが成功し、https://subarubknb03.github.io/tcal-analyzer/ が表示されること
4. `setup-node` のログで Node 24.22.1 以上が使われていること
