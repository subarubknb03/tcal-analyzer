# T00002: Docker + Nix Flakes による Vite/React 開発環境構築

## 目的

Nix flakesを使ってDockerコンテナ内に再現性の高いVite/React開発環境を構築する。ローカルのdotfilesをbind mountで注入し、neovim・oh-my-zsh・Claude Codeを利用可能にする。

## 変更ファイル

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `flake.nix` | 新規作成 | Nixパッケージ定義（nodejs_22, neovim, zsh等） |
| `Dockerfile` | 全面書き換え | Nixインストール + flake経由でパッケージ管理 |
| `compose.yaml` | 更新 | dotfilesのbind mount・環境変数追加 |
| `.gitignore` | 更新 | Nix成果物・Node成果物の除外 |
| `~/.claude/settings.json` | 更新 | statuslineコマンドのパスを`$HOME`ベースに変更 |

## 主要な設計決定

### Nixインストーラー
- 公式インストーラーはrootでの実行を拒否するため、**DeterminateSystems製インストーラー**を使用
- `--init none`でsystemd不要、`--no-confirm`で非対話的インストール
- `sandbox = false`と`experimental-features = nix-command flakes`をインストール時に設定
- マルチユーザーモードのため、nixデーモンをバックグラウンド起動してから`nix profile install`を実行

### Nixパッケージ管理方針
- `packages.default = buildEnv { ... }` + `nix profile install .#default` を採用
- `nix develop`はインタラクティブシェル専用のため、コンテナのCMDから起動する通常zshには不適
- nixpkgs-unstableを使用 → neovim 0.12.1（aptの0.9.5より大幅に新しい）

### Claude Codeインストール
- `npm install -g --prefix /usr/local`で`/usr/local/bin/claude`にインストール
- nixのnpmはデフォルトprefixがPATHに含まれない場合があるため、prefixを明示指定

### dotfiles注入方法
- DockerfileのCOPYは`~`を展開しないため、compose.yamlのbind mountで注入
- `~/.zshrc`, `~/.p10k.zsh`, `~/.config/nvim` → read_only: true
- `~/.oh-my-zsh` → cacheへの書き込みが必要なためread_only不可
- `~/.local/share/nvim` → lazy.nvimプラグイン本体。read_only不可（shadaファイル等の書き込みが必要）

### ターミナル色設定
- `TERM=xterm-256color`と`COLORTERM=truecolor`を環境変数で設定
- 未設定だとoh-my-zshがカラー非対応ターミナルと判断し、PS1に色が当たらない

### Claude Codeステータスライン
- `~/.claude/settings.json`の`statusline.command`が`/Users/subaru/...`の絶対パスを参照していた
- `$HOME/.claude/statusline-command.sh`に変更することでローカル・コンテナ両方で動作

### Claude Code設定
- `~/.claude` → 書き込み可能のまま（認証情報・会話履歴の書き込みが必要なため）

## 検証方法

```sh
docker compose build     # 初回は10〜20分程度かかる
docker compose up -d
docker compose exec web zsh

# コンテナ内で確認
node --version     # v22.x.x
nvim --version     # 0.12.x
claude --version   # Claude Codeのバージョン
gh --version       # GitHub CLIのバージョン
echo $ZSH          # oh-my-zshのパス（色付きプロンプトが表示される）
```
