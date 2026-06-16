import {
  getFunctionNameInfo,
  tableMemo,
  type PrototypeAPIObject,
  type RowData,
  type Table_Internal,
  type TableFeatures,
} from "@tanstack/react-table";

export function assignPrototypeAPIs<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TDeps extends ReadonlyArray<any>,
  TDepArgs,
>(
  prototype: Record<string, any>,
  table: Table_Internal<TFeatures, TData>,
  apis: PrototypeAPIObject<TDeps, NoInfer<TDepArgs>>,
): void {
  for (const [staticFnName, { fn, memoDeps }] of Object.entries(apis)) {
    const { fnKey, fnName } = getFunctionNameInfo(staticFnName);

    if (memoDeps) {
      // For memoized methods, create a function that lazily initializes
      // the memo on first access and stores it on the instance
      const memoKey = `_memo_${fnKey}`;

      prototype[fnKey] = function (this: any, ...args: Array<any>) {
        // Lazily create memo on first access for this instance
        if (!this[memoKey]) {
          const self = this;
          this[memoKey] = tableMemo({
            memoDeps: (depArgs) => memoDeps(self, depArgs),
            fn: (...deps) => fn(self, ...deps),
            fnName,
            objectId: self.id,
            table,
          });
        }
        return this[memoKey](...args);
      };
    } else {
      // Non-memoized methods just call the static function with `this`
      prototype[fnKey] = function (this: any, ...args: Array<any>) {
        return fn(this, ...args);
      };
    }
  }
}
