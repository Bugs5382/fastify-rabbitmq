/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
/* istanbul ignore next */
import EventEmitter from "node:events";

export interface Deferred<T = any> {
  promise: Promise<T>;
  reject: (reason?: any) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

export function createDeferred<T = any>(noUncaught?: boolean): Deferred<T> {
  const dfd: any = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  /* istanbul ignore next */
  if (noUncaught) {
    dfd.promise.catch(() => {});
  }
  return dfd;
}

export async function expectEvent<T = any>(
  emitter: EventEmitter,
  name: string | symbol,
): Promise<T> {
  return await new Promise<T>((resolve) => {
    emitter.once(name, resolve);
  });
}

export async function sleep(ms: number): Promise<any> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
