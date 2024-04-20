export default function gt(this: object, a: number, b: number) {
  var next = arguments[arguments.length - 1];
  return a > b ? next.fn(this) : next.inverse(this);
}
