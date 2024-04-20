import { isNotNil } from 'ramda';

export default function notNil(this: object, a: any) {
  var next = arguments[arguments.length - 1];

  return isNotNil(a) ? next.fn(this) : next.inverse(this);
}
