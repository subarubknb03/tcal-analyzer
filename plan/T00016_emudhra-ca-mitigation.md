# T00016 eMudhra 中間 CA 鍵漏洩への対策

## 背景・目的

2026-10-20 に eMudhra の中間 CA 8 本の秘密鍵漏洩が公表された
（https://emudhra.we-have-a-problem.com/ 、Mozilla bug 2083449）。
主要ブラウザは CT 強制とブロックリストで保護済みだが、CT を検証しない
OS / 言語ランタイム / ツールの CA ストアは、パッチ適用または
`emSign ECC Root CA - G3` / `Comodo AAA Services root` の不信任化が必要。

本リポジトリのアプリ本体（GitHub Pages 上のブラウザアプリ）は影響を受けないが、
開発・ビルド環境に未修正のコンポーネントが含まれるため対策する。

## 対象と対策

| # | 対象 | 問題 | 対策 |
|---|---|---|---|
| 1 | `flake.lock` | nixpkgs が 2026-04-16 固定。`nodejs_22`（CA 同梱）・`cacert`/NSS が修正前 | `flake.nix` の `nodejs_22` を `nodejs_24` に切替え、`nix flake update nixpkgs` で更新。Node ≥ 24.22.1 / NSS ≥ 3.131.1 を確認 |
| 2 | `Dockerfile` | Ubuntu `ca-certificates` がレイヤーキャッシュで古いまま残り得る。Claude Code がバージョン未指定 | `ca-certificates` のバージョン下限チェック（≥ `20260816ubuntu0.24.04.1`）をビルド時に追加。Claude Code を `^2.1.303` で指定。`--no-cache --pull` で再ビルド |
| 3 | `.github/workflows/deploy.yml` | `setup-node` が `check-latest` なしのためランナー同梱の古い 22.x を使い得る | `node-version: 24` に変更し `check-latest: true` を追加 |

## 実施上の注意

- ローカル macOS には nix がないため、`flake.lock` の更新はコンテナ内または
  `nixos/nix` イメージで実施する（ユーザー作業）。
  - 旧 lock のままでもコンテナはビルドできるので、Dockerfile に Node バージョンの
    ビルド失敗チェックは入れない（lock 更新の手段を塞がないため）。
- Node は 22 系から 24 系（Active LTS、修正版 24.22.1）へ移行する。ローカル（nvm）も v24.22.1 であり、`@types/node` も `^24` のため整合する。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `Dockerfile` | `ca-certificates` バージョン下限チェック追加、Claude Code のバージョン指定 |
| `flake.nix` | `nodejs_22` → `nodejs_24`（packages / devShells の 2 箇所） |
| `.github/workflows/deploy.yml` | `node-version: 24`、`check-latest: true` |
| `flake.lock` | nixpkgs 更新（ユーザーがコンテナ内で実施） |

## 検証

1. `docker compose build --no-cache --pull` が成功すること
2. コンテナ内で `nix flake update nixpkgs` → 再ビルド後、以下を確認
   - `dpkg -l ca-certificates` が `20260816ubuntu0.24.04.1` 以上
   - `node -v` が 24.22.1 以上
   - `claude --version` が 2.1.303 以上
3. 各環境で以下が **証明書エラーになる** こと（漏洩中間 CA を信頼していない）
   - `curl -sS https://dv-g3b-emudhra.we-have-a-problem.com/`
   - `node -e "require('https').get('https://dv-g3b-emudhra.we-have-a-problem.com/',r=>console.log('NG',r.statusCode)).on('error',e=>console.log('OK',e.code))"`
4. GitHub Actions のログで `setup-node` が 24.22.1 以上を使っていること
