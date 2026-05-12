import { Orchestrator } from "@core/core/orchestrator/Orchestrator";

function main(): void {
  try {
    console.log(typeof Orchestrator);
  } catch (err) {
    console.error("[test-core] Failed to import Orchestrator:", err);
    process.exitCode = 1;
  }
}

main();
