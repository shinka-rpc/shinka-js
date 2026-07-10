import type { BansheeEnvironment } from "../types";

export default {
  add: (target) => self.removeEventListener("beforeunload", target),
  rm: (target) => self.removeEventListener("beforeunload", target),
} as BansheeEnvironment;
