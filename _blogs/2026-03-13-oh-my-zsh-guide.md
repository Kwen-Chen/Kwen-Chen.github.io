---
layout: blog
title: 'Oh My Zsh Guide'
date: 2026-03-13
permalink: /posts/2026/03/oh-my-zsh-guide/
tags:
  - shell
  - zsh
  - ai-gen
---

# Oh My Zsh Guide
This article introduces the basic usage of Oh My Zsh, including installation, theme configuration, recommendation and configuration of commonly used plugins.

## 1. Installation

### Prerequisites

- macOS or Linux
- `zsh` installed (macOS has it by default since Catalina)
- `curl` or `wget`
- `git`

### Install Oh My Zsh

```bash
# via curl
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# or via wget
sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

After installation, Oh My Zsh lives at `~/.oh-my-zsh`, and your shell config is at `~/.zshrc`.

> Your original `.zshrc` is backed up as `~/.zshrc.pre-oh-my-zsh`.

### Uninstall (if needed)

```bash
uninstall_oh_my_zsh
```

---

## 2. Theme Configuration

### How to Set a Theme

Edit `~/.zshrc` and change the `ZSH_THEME` line:

```bash
ZSH_THEME="agnoster"
```

Then reload:

```bash
source ~/.zshrc
```

### Browse Available Built-in Themes

All built-in themes are located at `~/.oh-my-zsh/themes/`. You can preview them at:
https://github.com/ohmyzsh/ohmyzsh/wiki/Themes

### Popular Themes

| Theme | Description |
|---|---|
| `robbyrussell` | Default. Minimal, shows git branch |
| `agnoster` | Powerline-style. Shows user, dir, git status, error codes |
| `af-magic` | Two-line prompt, clean and informative |
| `refined` | Simple, elegant, no special fonts needed |
| `random` | Loads a random theme each session (fun for exploration) |

### Fonts for Powerline Themes (agnoster, etc.)

Themes like `agnoster` use special arrow/icon characters that require a **Powerline-compatible font**. Without it, you'll see broken symbols like `?` or `□`.

**Recommended font**: [MesloLGS NF](https://github.com/romkatv/powerlevel10k#fonts)

**Install on macOS:**

```bash
# via Homebrew
brew install font-meslo-lg-nerd-font
```

Then set your terminal font:
- **iTerm2**: Preferences → Profiles → Text → Font → select "MesloLGS NF"
- **Terminal.app**: Preferences → Profiles → Font → Change → select "MesloLGS Nerd Font"
- **VS Code**: Settings → Terminal > Integrated: Font Family → `MesloLGS NF`

---

## 3. Plugin Configuration

### How Plugins Work

Plugins are loaded via the `plugins=()` array in `~/.zshrc`:

```bash
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
```

There are two types of plugins:

| Type | Location | Installation |
|---|---|---|
| Built-in | `~/.oh-my-zsh/plugins/` | Just add the name to `plugins=()` |
| Custom/Third-party | `~/.oh-my-zsh/custom/plugins/` | Clone the repo first, then add to `plugins=()` |

> **Warning**: Don't go overboard with plugins. Each one adds to shell startup time. Stick to the ones you actually use.

### Installing Third-party Plugins

The general pattern:

```bash
# Clone into the custom plugins directory
git clone <repo-url> ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/<plugin-name>

# Then add <plugin-name> to the plugins=() array in ~/.zshrc
# Then reload
source ~/.zshrc
```

---

## 4. Installed Plugins - Introduction & Usage

### `git` (built-in)

Provides **200+ aliases** for common git commands so you type less.

#### Commonly Used Aliases

| Alias | Full Command | Description |
|---|---|---|
| `gst` | `git status` | Check working tree status |
| `ga` | `git add` | Stage files |
| `gaa` | `git add --all` | Stage all changes |
| `gc` | `git commit` | Commit |
| `gcmsg "msg"` | `git commit -m "msg"` | Commit with message |
| `gco` | `git checkout` | Switch branch |
| `gcb` | `git checkout -b` | Create & switch to new branch |
| `gp` | `git push` | Push to remote |
| `gl` | `git pull` | Pull from remote |
| `gd` | `git diff` | Show diff |
| `glog` | `git log --oneline --decorate --graph` | Pretty git log |
| `gb` | `git branch` | List branches |
| `gm` | `git merge` | Merge |
| `grb` | `git rebase` | Rebase |
| `gsta` | `git stash push` | Stash changes |
| `gstp` | `git stash pop` | Pop stash |

#### Example Workflow

```bash
# Instead of:
git checkout -b feature/login
git add --all
git commit -m "add login page"
git push

# You type:
gcb feature/login
gaa
gcmsg "add login page"
gp
```

#### See All Aliases

```bash
alias | grep git
```

---

### `z` (built-in)

A **directory jumper** that learns which directories you visit most and lets you jump to them with partial name matching.

#### Installation

Already built-in. Just add `z` to your `plugins=()`.

#### How It Works

`z` tracks every directory you `cd` into and ranks them by **frequency** and **recency** (a combined metric called "frecency"). After using your shell normally for a while, you can jump to any directory with just a keyword.

#### Usage

```bash
# Suppose you frequently visit these directories:
#   /Users/chenkun/projects/my-app
#   /Users/chenkun/documents/reports

# Jump by partial match:
z my-app          # → /Users/chenkun/projects/my-app
z reports         # → /Users/chenkun/documents/reports
z proj            # → /Users/chenkun/projects (most frecent match)

# Multiple keywords (all must match, in order):
z proj app        # → /Users/chenkun/projects/my-app

# List all tracked directories with scores:
z                 # shows the ranked list
```

#### Tips

- You need to `cd` into directories normally first so `z` can learn them
- The more you visit a directory, the higher its score
- It works after just a few visits — start using `cd` as normal and `z` picks up quickly

---

### `zsh-autosuggestions` (third-party)

Suggests commands **as you type** based on your command history. The suggestion appears in gray text after your cursor.

#### Installation

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

Then add `zsh-autosuggestions` to `plugins=()` in `~/.zshrc`.

#### How It Works

As you start typing, the plugin searches your shell history and shows the most recent matching command as a gray ghost text suggestion.

#### Key Bindings

| Key | Action |
|---|---|
| `→` (Right Arrow) | Accept the entire suggestion |
| `End` | Accept the entire suggestion |
| `Ctrl + →` | Accept the next word of the suggestion |
| `Ctrl + E` | Accept the entire suggestion (Emacs-style) |

#### Example

```
# You previously ran: docker compose up -d --build
# Now you type: dock
# You see:       dock|er compose up -d --build   (gray text)
#                    ^ cursor here
# Press → to accept the full command
```

#### Customization (optional, add to `~/.zshrc`)

```bash
# Change suggestion highlight color (default: fg=8, which is gray)
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#808080,underline"

# Change suggestion strategy (default: history)
# "match_prev_cmd" considers the previous command for context
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
```

---

### `zsh-syntax-highlighting` (third-party)

Provides **real-time syntax highlighting** as you type commands. Valid commands turn **green**, invalid ones turn **red**, strings are highlighted, and more.

#### Installation

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

Then add `zsh-syntax-highlighting` to `plugins=()` in `~/.zshrc`.

> **Important**: This plugin should be listed **last** in the `plugins=()` array for best results.

#### What It Highlights

| Element | Color | Example |
|---|---|---|
| Valid commands | **Green** | `ls`, `git`, `docker` |
| Invalid/unknown commands | **Red** | `gti` (typo) |
| Built-in commands | **Bold green** | `cd`, `echo`, `export` |
| Aliases | **Green** | `gst`, `ll` |
| Strings (quoted) | **Yellow** | `"hello world"` |
| Options/flags | **Cyan** | `--verbose`, `-la` |
| Paths (existing) | **Underlined** | `~/Documents` |
| Paths (non-existing) | **No underline** | `~/nonexistent` |

#### Example

```bash
# Type a valid command → text turns green as you type
ls -la ~/Documents

# Type an invalid command → text turns red immediately
lss -la ~/Documents
#^^^ red! You know it's wrong before hitting Enter
```

#### Why It's Useful

- Catch typos **before** pressing Enter
- Instantly see if a command exists
- Verify file paths exist as you type them
- Distinguish between strings, options, and commands visually

No configuration needed — it works out of the box.

---

## 5. Quick Reference: Your Current Setup

Your `~/.zshrc` plugin line:

```bash
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
```

| Plugin | Type | Purpose |
|---|---|---|
| `git` | Built-in | Git command aliases (`gst`, `gco`, `gp`, ...) |
| `z` | Built-in | Jump to directories by keyword |
| `zsh-autosuggestions` | Custom | Ghost-text command suggestions from history |
| `zsh-syntax-highlighting` | Custom | Real-time command coloring (green=valid, red=invalid) |

## 6. Useful Commands to Remember

```bash
# Reload config after editing ~/.zshrc
source ~/.zshrc

# List all active aliases
alias

# Check current theme
echo $ZSH_THEME

# Update Oh My Zsh
omz update

# List all available built-in plugins
ls ~/.oh-my-zsh/plugins/

# Get help for a specific plugin
# (most plugins have a README)
cat ~/.oh-my-zsh/plugins/<plugin-name>/README.md
```
