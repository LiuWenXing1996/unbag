export type MaybePromise<T> = T | Promise<T>;
export type MaybeFunction<T extends (...args: any) => any> =
  | T
  | ReturnType<T>;
