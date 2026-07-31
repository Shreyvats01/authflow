#!/usr/bin/env node

import { intro, outro, log, spinner } from "@clack/prompts";
import chalk from "chalk";
import { init } from "./commands/init";
import { add } from "./commands/add";
import { generate } from "./commands/generate";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  intro(chalk.bgBlue.white(" authflow cli "));

  try {
    switch (command) {
      case "init":
        await init(args.slice(1));
        break;
      case "add":
        await add(args.slice(1));
        break;
      case "generate":
        await generate(args.slice(1));
        break;
      case "status":
        log.info("AuthFlow is running smoothly!");
        break;
      default:
        log.error(`Unknown command: ${command || "none"}`);
        log.info("Available commands: init, add, generate, status");
        process.exit(1);
    }
  } catch (error) {
    log.error(`An error occurred: ${(error as Error).message}`);
    process.exit(1);
  }

  outro(chalk.green("Done!"));
}

main().catch(console.error);
