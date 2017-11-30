// TODO move to core-module where `ValidKey` is defined also
export function isValidKey(key: any): boolean {
  const type = typeof key;
  return type === 'number' || type === 'string' || key instanceof Date;
}
