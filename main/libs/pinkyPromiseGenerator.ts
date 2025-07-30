
export function pinkyPromiseGenerator (cb?: Function) {
    let _resolve, _reject;
    let status = "pending";

  const prom = new Promise((resolve, reject) => {
    _resolve = (value: unknown) => {
      prom.status = "resolved";
      resolve(value);
    };
    _reject = (...args: any[]) => {
      prom.status = "rejected";
      reject(...args);
    };
  }) as Promise<unknown> & {
    forceResolve: (value: unknown) => void;
    forceReject: (...args: any[]) => void;
    status: string;
  };

  // inject methods to the promise
  prom.forceResolve = _resolve as unknown as (value: unknown) => void;
  prom.forceReject = _reject as unknown as (...args: any[]) => void;
  prom.status = status;

  // if a callback is provided, call it
  if (typeof cb === "function") {
    cb(_resolve, _reject);
  }

  // return the promise
  return prom;
}
