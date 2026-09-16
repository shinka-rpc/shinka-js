import { spawn } from "child_process";
import { publishPlan } from "./lib/publish-plan.mjs";

const publish = async (path) => {
  const options = {
    cwd: path,
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr],
  };
  const args = ["publish"];
  const publishProcess = spawn("npm", args, options);
  await new Promise((resolve, reject) => publishProcess.on("exit", resolve));
};

(async () => {
  const plan = (await publishPlan())
    .filter((i) => i.publish)
    .map((i) => i.path);
  for (const path of plan) await publish(path); // AVOID `Promise.all`
})();
