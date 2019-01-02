#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const os = require("os");

const octokit = require("@octokit/rest")();
const prompt = require("prompt-sync")({ sigint: true });
const chalk = require("chalk");
const cli = require("cac")();
const version = require("./package.json").version;

const home = os.homedir();
const configPath = path.join(home, ".github-bio");

process.on("SIGINT", () => process.exit(0));

const loadConfig = function() {
  const badToken = { token: undefined };

  if (!fs.existsSync(configPath)) {
    return badToken;
  }

  try {
    const config = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(config);
  } catch (error) {
    return badToken;
  }
};

const saveConfig = function(token) {
  const config = { token };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

cli.option("--bio <bio>", "Update your bio on GitHub", { default: undefined });

cli.version(version);
cli.help();

const parsed = cli.parse();

const newBioText = parsed.options.bio;
if (newBioText === undefined) {
  cli.outputHelp();
  process.exit(1);
}

const githubUrl = "https://github.com/settings/tokens";
let token = loadConfig().token;
if (token === null) {
  token = undefined;
}

if (token === undefined) {
  console.log(
    `Missing token. You can set one up at ${chalk.underline(githubUrl)}.
Set the user scope.
    `
  );
  while (token === undefined || token.trim().length === 0) {
    token = prompt("Token: ");
    if (token !== undefined) {
      saveConfig(token);
      break;
    }
  }
}

octokit.authenticate({
  type: "token",
  token
});

octokit.users.updateAuthenticated({ bio: newBioText }).then(result => {
  console.log(
    result.status === 200 ? `✅  bio: ${newBioText}` : `${result} 🔴`
  );
});
