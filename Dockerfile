FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo
ENV ZSH_DISABLE_COMPFIX=true
ENV DISABLE_AUTO_UPDATE=true

RUN apt-get update && apt-get install -y \
    curl \
    xz-utils \
    ca-certificates \
    sudo \
    && rm -rf /var/lib/apt/lists/*

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
    /root/.nix-profile/bin/npm install -g --prefix /usr/local @anthropic-ai/claude-code

WORKDIR /mnt/workspace
CMD ["/root/.nix-profile/bin/zsh"]
