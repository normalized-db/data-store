import { NormalizedData } from '@normalized-db/core';

export function setToArray(data: NormalizedData) {
  Object.keys(data)
    .forEach(type =>
      data[type].forEach(item => {
        if ('_refs' in item) {
          Object.keys(item._refs).forEach(refType =>
            item._refs[refType] = Array.from(item._refs[refType])
          );
        }
      })
    );

  return data;
}
