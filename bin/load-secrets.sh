#!/bin/bash
# Script to load secrets from 1Password vault
# This script can be sourced to load environment variables from 1Password
# 
# Usage: 
#   source ./load-secrets.sh          # Load all secrets
#   ./load-secrets.sh                 # Load secrets and continue with execution
#
# The script loads secrets from the xnok/emma vault and exports them as environment variables

# Vault configuration
VAULT="xnok/emma"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if op is available
if ! command -v op &> /dev/null; then
    print_error "1Password CLI (op) is not installed"
    return 1 2>/dev/null || exit 1
fi

# Check if OP_SERVICE_ACCOUNT_TOKEN is set
if [ -z "$OP_SERVICE_ACCOUNT_TOKEN" ]; then
    print_warning "OP_SERVICE_ACCOUNT_TOKEN is not set"
    print_info "Please set it or ensure you're signed in to 1Password"
fi

print_info "Loading secrets from 1Password vault: ${VAULT}"

# Function to safely load and export a secret
load_secret() {
    local var_name=$1
    local item_name=$2
    local field_name=$3
    local required=${4:-false}
    
    # Use op item get instead of op read for vaults with special characters
    local value=$(op item get "$item_name" --vault "$VAULT" --fields "label=$field_name" --reveal 2>/dev/null)
    
    if [ -z "$value" ]; then
        if [ "$required" = true ]; then
            print_error "Failed to load required secret: $var_name from $item_name/$field_name"
            return 1
        else
            print_warning "Optional secret not found: $var_name from $item_name/$field_name"
            return 0
        fi
    fi
    
    export "$var_name"="$value"
    print_success "Loaded $var_name"
    return 0
}

# Load secrets
print_info "📥 Fetching secrets..."

# Cloudflare API Token (required for deployment and remote dev)
load_secret "CLOUDFLARE_API_TOKEN" "CLOUDFLARE_API_TOKEN" "password" true || {
    print_error "Failed to load Cloudflare API token"
    return 1 2>/dev/null || exit 1
}

# Add more secrets as needed
# Examples:
# load_secret "DATABASE_URL" "database-credentials" "url" false
# load_secret "API_KEY" "api-keys" "production-key" false
# load_secret "GITHUB_TOKEN" "github-token" "token" false

print_success "All secrets loaded successfully"
print_info "Environment variables are now available in this shell session"

# If the script is being executed (not sourced), you can add commands to run
# Check if script is being sourced or executed
(return 0 2>/dev/null) && sourced=1 || sourced=0

if [ $sourced -eq 0 ]; then
    print_info "Script was executed. Environment variables are set for this session only."
    print_warning "To use in your current shell, run: source ./load-secrets.sh"
fi
