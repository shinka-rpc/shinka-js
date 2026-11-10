export type Resolve<T> = (value: T | PromiseLike<T>) => void;
export type Reject = (reason?: any) => void;

export type ResolveReject<T> = [Resolve<T>, Reject];
