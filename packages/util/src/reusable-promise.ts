type PromiseExecutor<P> = (
  resolve: (value: P | PromiseLike<P>) => void,
  reject: (reason?: P) => void,
) => void;

type ResolveFn<P> = (value: P) => void;

type State<P> = {
  promise: Promise<P>;
  resolve: ResolveFn<P>;
  reject: ResolveFn<P>;
  done: boolean;
};

function renewExecutor<P>(
  this: Partial<State<P>>,
  resolve: ResolveFn<P>,
  reject: ResolveFn<P>,
) {
  this.resolve = resolve;
  this.reject = reject;
}

const renewState = <P>(
  state: Partial<State<P>>,
  renewExecutor: PromiseExecutor<P>,
) => {
  state.done = false;
  state.promise = new Promise<P>(renewExecutor);
  return state as State<P>;
};

const toResolver =
  <P>(state: State<P>) =>
  (key: "resolve" | "reject") =>
  (value: P) => {
    if (state.done) throw new Error("Already done");
    state.done = true;
    state[key](value);
  };

export class ReusablePromise<P> {
  private state!: State<P>;
  private renewExecutor!: PromiseExecutor<P>;

  public resolve!: ResolveFn<P>;
  public reject!: ResolveFn<P>;

  constructor() {
    const state: Partial<State<P>> = {};
    this.renewExecutor = (renewExecutor<P>).bind(state);
    this.state = renewState(state, this.renewExecutor);

    const resolver = toResolver(this.state);

    this.resolve = resolver("resolve");
    this.reject = resolver("reject");

    Object.freeze(this);
  }

  public then = (
    onfulfilled?: ((value: P) => void) | null | undefined,
    onrejected?: ((reason: any) => void) | null | undefined,
  ) => this.state.promise.then(onfulfilled, onrejected);

  public catch = (onrejected?: ((reason: P) => void) | null | undefined) =>
    this.state.promise.catch(onrejected);

  public reset = () => {
    if (this.state.done) renewState(this.state, this.renewExecutor);
  };

  public get isDone() {
    return this.state.done;
  }
}
