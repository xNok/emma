{
  description = "Emma - Embeddable Forms for Hugo development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true; # Required for _1password-cli
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
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
        };
      }
    );
}
