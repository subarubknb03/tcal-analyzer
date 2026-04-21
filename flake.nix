{
  description = "tcal-analyzer dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages.default = pkgs.buildEnv {
          name = "tcal-analyzer-env";
          paths = with pkgs; [
            nodejs_22
            git
            neovim
            zsh
            curl
            wget
            unzip
            ripgrep
            fd
            fzf
            tree
            gh
          ];
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            git
            neovim
            zsh
          ];
        };
      }
    );
}
