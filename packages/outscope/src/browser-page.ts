import type { OutScope } from "./types";

export default {
  add: (target) => self.addEventListener("beforeunload", target),
  remove: (target) => self.removeEventListener("beforeunload", target),
} satisfies OutScope;
