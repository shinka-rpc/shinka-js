import { spawn } from "child_process";
import { publishPlan } from "./lib/publish-plan.mjs";
import { obsolete } from "./lib/obsolete.mjs";

const unpublish = async (name) => {
  const options = {
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr],
  };
  const args = ["unpublish", name];
  const publishProcess = spawn("npm", args, options);
  await new Promise((resolve, reject) => publishProcess.on("exit", resolve));
};

function* toPackages(plan, last) {
  for (const i of plan) {
    obsolete(i, last);
    for (const v of i.obsolete.obsolete) yield `${i.name}@${v}`;
  }
}

(async () => {
  const packages = Array.from(toPackages(await publishPlan(), 3));
  for (const name of packages) await unpublish(name);
})();
