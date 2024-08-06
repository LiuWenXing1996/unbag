export type MaybePromise<T> = T | Promise<T>;
export type DeepPartial<T> = T extends (...args: any) => any
  ? T
  : { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepReadonly<T> = T extends (...args: any) => any
  ? T
  : { readonly [P in keyof T]: DeepReadonly<T[P]> };
