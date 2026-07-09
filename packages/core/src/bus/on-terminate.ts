export type VarsBye = {
  bye: 0 | 1;
};

export function byeReset(this: VarsBye) {
  this.bye = 0;
}

type OnTerminateThis = readonly [VarsBye, () => void, () => void];

export function onTerminated(this: OnTerminateThis) {
  this[0].bye = 0;
  this[1]();
  this[2]();
}
