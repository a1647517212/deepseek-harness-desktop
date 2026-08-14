#!/usr/bin/env node
/**
 * Point the fork's update channel at the given GitHub owner.
 *
 * Usage:  node scripts/set-fork-owner.mjs <owner> [repo]
 *         (repo defaults to "deepseek-harness-desktop")
 *
 * Replaces the OWNER_PLACEHOLDER in package.json (homepage, repository.url,
 * build.publish.owner - the update channel for electron-updater) and fixes
 * the README badge URLs.
 *
 * Idempotent and merge-safe: upstream merges can silently restore the
 * original author's publish target in package.json. ALWAYS run this script
 * again after merging upstream changes, and check 'git diff package.json'
 * before pushing.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [owner, repoName = 'deepseek-harness-desktop'] = process.argv.slice(2)
if (!owner || !/^[A-Za-z0-9-]+$/.test(owner)) {
  console.error('usage: node scripts/set-fork-owner.mjs <owner> [repo]')
  process.exit(1)
}

const files = ['package.json', 'README.md', 'README.en.md']
for (const file of files) {
  const path = new URL('../' + file, import.meta.url)
  const before = readFileSync(path, 'utf8')
  const after = before
    .replaceAll('OWNER_PLACEHOLDER', owner)
    .replaceAll('hongfeiyucode/deepseek-harness-desktop', owner + '/' + repoName)
  if (after !== before) {
    writeFileSync(path, after)
    console.log('updated ' + file)
  } else {
    console.log('unchanged ' + file)
  }
}
console.log('update channel now: github.com/' + owner + '/' + repoName)