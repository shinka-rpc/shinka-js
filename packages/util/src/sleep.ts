export type SleepOpts = { signal?: AbortSignal };

export const sleep = (
  time: number,
  { signal }: SleepOpts = {},
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);

    let timeoutId: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(signal!.reason);
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, time);
  });
