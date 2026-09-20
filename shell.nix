# Backwards-compatible shell.nix for classic nix-shell users
let
  pkgs = import <nixpkgs> {
    config = {
      allowUnfree = true; # Required for _1password-cli
    };
  };
in
pkgs.mkShell {
  name = "emma-dev-shell";

  buildInputs = with pkgs; [
    # Runtime & Package Management
    nodejs_22
    corepack
    yarn

    # Static Site & Hugo Integration
    hugo

    # Cloudflare Platform Tooling
    wrangler

    # Secrets & Identity Management
    _1password-cli

    # Quality Assurance & Tooling
    actionlint
    gh
    git
  ];

  shellHook = ''
    export COREPACK_ENABLE_STRICT=0
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  '';
}
