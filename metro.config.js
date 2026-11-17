const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");

// landing/ is the separate Astro project of the tester pages, with its own node_modules
const landing = path.resolve(__dirname, "landing").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`^${landing}[\\\\/]`),
];

module.exports = config;
