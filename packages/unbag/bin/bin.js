#!/usr/bin/env node

async function start() {
  const { read } = require("../dist/cjs/index.js");
  return read();
}
start();
