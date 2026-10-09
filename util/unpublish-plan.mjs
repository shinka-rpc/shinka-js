import { publishPlan } from "./lib/publish-plan.mjs";
import { obsolete } from "./lib/obsolete.mjs";

const plan = (i) => {
  obsolete(i, 3);
  return { name: i.name, obsolete: i.obsolete.obsolete };
};

(async () =>
  console.log(
    (await publishPlan()).map(plan).filter((i) => i.obsolete.length),
  ))();
