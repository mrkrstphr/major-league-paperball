export default function includes(this: object, a: Array<any>, b: any) {
  var next = arguments[arguments.length - 1];
  return a.includes(b) ? next.fn(this) : next.inverse(this);
}
