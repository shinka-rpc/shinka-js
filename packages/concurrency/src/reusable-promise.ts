type ResolveFn<P> = (value: P) => void;
type RejectFn = (value?: any) => void;

type State<P> = {
  promise: Promise<P>;
  resolve: ResolveFn<P>;
  reject: RejectFn;
  done: boolean;
};

const { freeze: objectFreeze, assign: objectAssign } = Object;

const resetState = <P>(state: State<P>) => {
  state.done = false;
  objectAssign(state, (Promise<P>).withResolvers());
};

const toResolver =
  <P>(state: State<P>, key: "resolve" | "reject") =>
  (value: P) => {
    state.done = true;
    state[key](value);
  };

export class ReusablePromise<P> {
  #state: State<P>;
  #reset: () => void;

  public resolve: ResolveFn<P>;
  public reject: RejectFn;

  constructor() {
    const state = {} as any as State<P>;
    this.#state = state;
    this.#reset = (resetState<P>).bind(null, state);
    this.#reset();
    this.resolve = toResolver(this.#state, "resolve");
    this.reject = toResolver(this.#state, "reject");

    objectFreeze(this);
  }

  public then = (
    onfulfilled?: ((value: P) => void) | null | undefined,
    onrejected?: ((reason?: any) => void) | null | undefined,
  ) => this.#state.promise.then(onfulfilled, onrejected);

  public catch = (onrejected?: ((reason?: P) => void) | null | undefined) =>
    this.#state.promise.catch(onrejected);

  public reset = () => {
    if (this.#state.done) this.#reset();
    return this;
  };

  public get isDone() {
    return this.#state.done;
  }
}
