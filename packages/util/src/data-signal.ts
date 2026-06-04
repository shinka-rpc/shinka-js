/**
 * Re-implementation https://docs.python.org/3/library/asyncio-sync.html#asyncio.Event
 * The *only* difference: in javascript it's possible to pass a payload
 */

type ResolveFn<P> = (value: P) => void;

type State<P> = {
  promise: Promise<P>;
  resolve: ResolveFn<P>;
  done: boolean;
};

function renewExecutor<P>(this: Partial<State<P>>, resolve: ResolveFn<P>) {
  this.resolve = resolve;
}

const renewState = <P>(state: Partial<State<P>>) => {
  state.done = false;
  state.promise = new Promise<P>(renewExecutor.bind<any>(state));
  return state as State<P>;
};

export class DataSignal<P> {
  private state!: State<P>;

  constructor() {
    this.state = renewState({});
    Object.freeze(this);
  }

  public reset = () => {
    if (this.state.done) renewState(this.state);
  };

  public set = (value: P) => {
    this.state.done = true;
    this.state.resolve(value);
  };

  public isSet = () => this.state.done;
  public wait = () => this.state.promise;
}
