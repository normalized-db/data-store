export class OrderByTypeMismatchError extends Error {

  constructor(field: string, t1: string, t2: string) {
    super(`Values on field "${field}" are not from same type hence cannot be compared (${t1}, ${t2})`);
  }
}
