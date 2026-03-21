---
name: lit-ui-cli
description: >-
  CLI reference for the lit-ui command-line tool (npx lit-ui). Use for init, add, list,
  theme, and migrate commands. Covers flags, config file format, and distribution modes.
---

# lit-ui CLI

## Installation & Usage

```bash
# Run without installing
npx lit-ui <command>

# Or install globally
npm install -g lit-ui
lit-ui <command>
```

## Commands

### `npx lit-ui init`

Initializes lit-ui in the current project.

Rules:
1. Copies the `TailwindElement` base class to your project.
2. Creates `lit-ui.config.json` with default configuration.
3. Prompts for distribution mode: `copy-source` (default) or `npm`.
4. Optionally injects AI skill context into detected AI tool directories.
5. Run once per project. Re-running is safe (non-destructive by default).

```bash
npx lit-ui init
```

### `npx lit-ui add <component>`

Adds one or more components to your project.

Rules:
1. In `copy-source` mode: copies component source files to `componentsDir`.
2. In `npm` mode: installs the `@lit-ui/<component>` package.
3. Injects a component-specific AI skill for the added component.
4. Component names use kebab-case (e.g., `date-picker`, `data-table`).
5. Multiple components can be added in one command.

```bash
# Add a single component
npx lit-ui add button

# Add multiple components
npx lit-ui add input select checkbox

# Add with flags
npx lit-ui add dialog --yes           # skip confirmation prompts
npx lit-ui add accordion --overwrite  # overwrite existing files
npx lit-ui add button --npm           # force npm mode for this component
npx lit-ui add input --cwd ./apps/my-app  # target a different working directory
```

Flags:
- `--yes` / `-y` — skip all confirmation prompts
- `--overwrite` — overwrite existing component files without prompting
- `--npm` — install as npm package (overrides config mode for this run)
- `--cwd <path>` — run as if in a different working directory

Available component names:
`button`, `checkbox`, `radio`, `switch`, `input`, `textarea`, `select`,
`calendar`, `date-picker`, `date-range-picker`, `time-picker`,
`dialog`, `accordion`, `tabs`, `tooltip`, `popover`, `toast`, `data-table`

### `npx lit-ui list`

Lists all available components and their install status in the current project.

```bash
npx lit-ui list
```

Output shows which components are installed, their version, and distribution mode.

### `npx lit-ui theme`

Theme management commands.

```bash
npx lit-ui theme        # interactive theme editor / token viewer
npx lit-ui theme apply  # apply a theme preset to your CSS entry point
```

Rules:
1. Themes are expressed as CSS custom properties injected into your CSS file.
2. The `--ui-*` token namespace is used for component-level tokens.
3. Global semantic colors (`--color-primary`, etc.) are set at the `:root` level.

### `npx lit-ui migrate`

Migration helpers for upgrading between lit-ui versions.

```bash
npx lit-ui migrate      # interactive migration guide
npx lit-ui migrate list # list available migrations
```

## Config File: `lit-ui.config.json`

Created at project root by `npx lit-ui init`.

```json
{
  "mode": "copy-source",
  "componentsDir": "src/components/ui",
  "tailwindCssPath": "src/styles/globals.css"
}
```

Config keys:
- `mode`: `"copy-source"` (default) or `"npm"` — distribution mode
- `componentsDir`: where component source files are copied in `copy-source` mode
- `tailwindCssPath`: path to your main CSS file (for token injection)

## Distribution Modes

Rules:
1. **copy-source** (default): Component `.ts` source files are copied into your project. You own the code. Edit freely. No dependency on `@lit-ui/*` packages for copied components.
2. **npm**: Components are installed as `@lit-ui/<name>` packages via your package manager. Updates come through npm. Less control, easier updates.
3. Mode is set globally in config but can be overridden per-command with `--npm`.

## AI Skill Injection

Rules:
1. `npx lit-ui init` detects AI tools (Claude, Codex, Agents, Gemini, Windsurf, etc.) and offers to inject the lit-ui overview skill.
2. `npx lit-ui add <component>` injects a component-specific skill for the added component.
3. Skills are placed in the tool's skill directory (e.g., `~/.agents/skills/lit-ui/`).
4. For global skill install (across all AI tools), use `node scripts/install-skill.mjs`.
