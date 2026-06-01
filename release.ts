#!/usr/bin/env bun
/**
 * Cuts a new Obsidian-plugin release.
 *
 * Usage:
 *   bun run release patch        # 1.0.0 -> 1.0.1
 *   bun run release minor        # 1.0.0 -> 1.1.0
 *   bun run release major        # 1.0.0 -> 2.0.0
 *   bun run release 1.4.2        # explicit version
 *
 * It bumps the version in manifest.json, package.json and versions.json,
 * rebuilds main.js, commits + pushes, then creates a GitHub release tagged with
 * the bare version (no leading "v") with main.js, manifest.json and styles.css
 * attached — exactly what Obsidian's installer expects.
 */
import { $ } from "bun";

type Bump = "patch" | "minor" | "major";

const SEMVER = /^\d+\.\d+\.\d+$/;

function fail(message: string): never {
	console.error(`\n✖ ${message}\n`);
	process.exit(1);
}

function bumpVersion(current: string, bump: Bump): string {
	const parts = current.split(".").map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) {
		fail(`Current version "${current}" is not valid semver (x.y.z).`);
	}
	let [major, minor, patch] = parts as [number, number, number];
	if (bump === "major") return `${major + 1}.0.0`;
	if (bump === "minor") return `${major}.${minor + 1}.0`;
	return `${major}.${minor}.${patch + 1}`;
}

async function readJson<T>(path: string): Promise<T> {
	return (await Bun.file(path).json()) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
	await Bun.write(path, JSON.stringify(value, null, 2) + "\n");
}

const arg = process.argv[2];
if (!arg) {
	fail("Provide a bump type (patch | minor | major) or an explicit version, e.g. `bun run release patch`.");
}

// Refuse to run on a dirty tree so we never sweep unrelated changes into the release commit.
const dirty = (await $`git status --porcelain`.text()).trim();
if (dirty) {
	fail("Working tree has uncommitted changes. Commit or stash them first:\n" + dirty);
}

const manifest = await readJson<{ version: string; minAppVersion: string }>("manifest.json");
const pkg = await readJson<Record<string, unknown>>("package.json");
const versions = await readJson<Record<string, string>>("versions.json");

const newVersion =
	arg === "patch" || arg === "minor" || arg === "major"
		? bumpVersion(manifest.version, arg)
		: arg;

if (!SEMVER.test(newVersion)) {
	fail(`"${newVersion}" is not a valid version. Use x.y.z (no leading "v").`);
}
if (newVersion === manifest.version) {
	fail(`Version is already ${newVersion}. Nothing to release.`);
}

// Tags are the source of truth for Obsidian — bail if one already exists.
const existingTags = (await $`git tag --list ${newVersion}`.text()).trim();
if (existingTags) {
	fail(`Git tag ${newVersion} already exists.`);
}

console.log(`Releasing ${manifest.version} → ${newVersion} (minAppVersion ${manifest.minAppVersion})`);

// 1. Bump versions across all three files.
manifest.version = newVersion;
pkg.version = newVersion;
versions[newVersion] = manifest.minAppVersion;
await writeJson("manifest.json", manifest);
await writeJson("package.json", pkg);
await writeJson("versions.json", versions);

// 2. Build the production bundle.
console.log("Building…");
await $`bun run build`;

// 3. Commit + push the version bump.
console.log("Committing & pushing…");
await $`git add manifest.json package.json versions.json`;
await $`git commit -m ${`Release ${newVersion}`} -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"`;
await $`git push origin HEAD`;

// 4. Create the GitHub release with the assets Obsidian installs.
console.log("Creating GitHub release…");
await $`gh release create ${newVersion} main.js manifest.json styles.css --title ${newVersion} --target main --generate-notes`;

console.log(`\n✔ Released ${newVersion}.`);
