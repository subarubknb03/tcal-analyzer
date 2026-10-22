FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo
ENV ZSH_DISABLE_COMPFIX=true
ENV DISABLE_AUTO_UPDATE=true

# ca-certificates は eMudhra中間CA鍵漏洩の修正版以上であることを確認（古いキャッシュ層の混入防止）
RUN apt-get update && apt-get install -y \
    curl \
    xz-utils \
    ca-certificates \
    sudo \
    && rm -rf /var/lib/apt/lists/* \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' ca-certificates)" ge 20260816ubuntu0.24.04.1

# DeterminateSystems製インストーラー（rootでのDocker環境に対応）
RUN curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | \
    sh -s -- install linux \
    --extra-conf "sandbox = false" \
    --extra-conf "experimental-features = nix-command flakes" \
    --init none \
    --no-confirm

ENV PATH="/root/.nix-profile/bin:/nix/var/nix/profiles/default/bin:$PATH"

WORKDIR /tmp/nix-setup
COPY flake.nix flake.lock ./

# nixデーモンをバックグラウンドで起動してからパッケージをインストール
RUN /nix/var/nix/profiles/default/bin/nix-daemon & \
    sleep 3 && \
    nix profile install .#default && \
    /root/.nix-profile/bin/npm install -g --prefix /usr/local @anthropic-ai/claude-code@^2.1.303

WORKDIR /mnt/workspace
CMD ["/root/.nix-profile/bin/zsh"]
