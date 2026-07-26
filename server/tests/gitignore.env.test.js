const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const serverRoot = path.join(__dirname, "..");

function isGitIgnored(relativePath) {
  try {
    execFileSync("git", ["check-ignore", "-q", relativePath], {
      cwd: serverRoot,
    });
    return true;
  } catch {
    return false;
  }
}

describe("gitignore env files", () => {
  test(".env and .env.local are ignored", () => {
    assert.equal(isGitIgnored(".env"), true);
    assert.equal(isGitIgnored(".env.local"), true);
  });

  test(".env.example is not ignored (safe template for commit)", () => {
    assert.equal(isGitIgnored(".env.example"), false);
  });
});
