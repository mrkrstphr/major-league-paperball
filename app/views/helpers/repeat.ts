export default function repeat(this: object) {
  const { hash, fn } = arguments[0];
  const { count, start = 0 } = hash;

  let result = '';

  for (let i = 0; i < count; i++) {
    const index = i + start;
    const data = { index };

    result += fn(this, {
      data,
      blockParams: [index, data],
    });
  }

  return result;
}
