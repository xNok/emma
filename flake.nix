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
            # Enable corepack for Yarn Berry
            export COREPACK_ENABLE_STRICT=0
            corepack enable >/dev/null 2>&1 || true

            # Check submodules for Hugo theme
            if [ -d "website" ] && [ ! -f "website/themes/gallery/theme.toml" ] && [ -d ".git" ]; then
              echo "🔄 Initializing git submodules for Hugo website..."
              git submodule update --init --recursive >/dev/null 2>&1 || true
            fi

            echo ""
            echo "🚀 Emma Development & Testing Environment Active!"
            echo "--------------------------------------------------"
            echo "Node.js: $(node --version 2>/dev/null || echo 'not found')"
            echo "Yarn:    $(yarn --version 2>/dev/null || echo 'not found')"
            echo "Hugo:    $(hugo version 2>/dev/null | cut -d' ' -f1-4 || echo 'not found')"
            echo "Wrangler:$(wrangler --version 2>/dev/null || echo 'not found')"
            echo "1Password CLI: $(op --version 2>/dev/null || echo 'not found')"
            echo "--------------------------------------------------"
            echo "Helpful commands:"
            echo "  source bin/load-secrets.sh   # Load Cloudflare secrets from 1Password"
            echo "  yarn build                   # Build all Emma packages"
            echo "  yarn test                    # Run tests across workspace"
            echo "  yarn emma                    # Run Emma CLI"
            echo "  yarn dev:website             # Run Hugo test website"
            echo ""
          '';
        };
      }
    );
}
