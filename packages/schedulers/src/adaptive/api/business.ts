import type { AdaptiveAPI } from "../types";

const performanceNow = performance.now.bind(performance);

const api: AdaptiveAPI<any, any> = {
  pop: async (asynq) => {
    const entry = await asynq.pop();
    const { 0: extra, 1: bus } = entry;
    if (!bus.alive) return entry;
    extra[1] = performanceNow();
    return entry;
  },
  push: (asynq, entry) => {
    const { 0: extra } = entry;
    if (extra[1] !== null) {
      extra[0] += performanceNow() - extra[1];
      extra[1] = null;
    }
    asynq.push(entry);
  },
};

export default api;
