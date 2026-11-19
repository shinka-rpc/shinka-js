const { keys: objectKeys } = Object;

export const clearObject = (state: Record<any, any>) => {
  for (const k of objectKeys(state)) delete state[k];
};

export const curryClearObject = (state: Record<any, any>) =>
  clearObject.bind(0, state);
