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

    # End-to-end Testing Browsers
    playwright-driver.browsers
  ];

  PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.playwright-driver.browsers}/chromium-1243/chrome-linux64/chrome";
  PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";

  shellHook = ''
    export COREPACK_ENABLE_STRICT=0
    export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
    export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
    export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${pkgs.playwright-driver.browsers}/chromium-1243/chrome-linux64/chrome"
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS="true"
  '';
}


