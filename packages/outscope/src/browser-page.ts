import type { OutScope } from "@shinka-rpc/core";

export default {
  add: (target) => self.addEventListener("beforeunload", target),
  remove: (target) => self.removeEventListener("beforeunload", target),
} satisfies OutScope;
