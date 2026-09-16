import { publishPlan } from "./lib/publish-plan.mjs";

const dropKeys = ["publish", "path"];

(async () => {
  const plan = (await publishPlan()).filter((i) => i.publish);
  plan.forEach((i) => {
    for (const k of dropKeys) delete i[k];
  });
  console.log(plan);
})();
