# Emma Hugo Module

Hugo module for embedding Emma forms into Hugo websites.

## Installation

### As a Hugo Module

```toml
# hugo.toml
[module]
  [[module.imports]]
    path = "github.com/yourusername/emma-hugo-module"
```

### As a Git Submodule

```bash
git submodule add https://github.com/yourusername/emma-hugo-module.git themes/emma
```

## Configuration

```toml
# hugo.toml
[params.emma]
  cdnUrl = "https://forms.yourdomain.com"
  defaultClass = "emma-form"
  showLoadingIndicator = true
```

## Usage

```markdown
{{< embed-form "contact-form-001" >}}
```

With custom class:

```markdown
{{< embed-form "newsletter" class="sidebar-form" >}}
```

## Documentation

See [/docs/features/hugo-shortcode.md](../../docs/features/hugo-shortcode.md) for complete documentation.

## Files

- `layouts/shortcodes/embed-form.html` - Main shortcode template
- `config.toml` - Module configuration
- `README.md` - This file
