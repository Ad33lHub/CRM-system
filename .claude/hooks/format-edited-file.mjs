#!/usr/bin/env node
/**
 * PostToolUse hook — auto-format the file Claude Code just edited.
 *
 * Wired in .claude/settings.json under hooks.PostToolUse for Edit|Write|MultiEdit.
 * Claude Code pipes the tool payload as JSON on stdin; we pull out the edited
 * file path and run Prettier on it. It is intentionally fail-safe: any error
 * (Prettier not installed yet, unsupported file, etc.) is swallowed so the hook
 * can NEVER block or break an edit.
 */
import { spawnSync } from 'node:child_process';

const FORMATTABLE = /\.(js|jsx|ts|tsx|json|jsonc|css|scss|md|mdx|html|yml|yaml)$/i;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw || '{}');
    const filePath = payload?.tool_input?.file_path;

    if (!filePath || !FORMATTABLE.test(filePath)) {
      process.exit(0);
    }

    spawnSync('npx', ['prettier', '--write', '--ignore-unknown', filePath], {
      stdio: 'ignore',
      shell: true,
    });
  } catch {
    // Never block an edit because of a formatter hiccup.
  }
  process.exit(0);
});
