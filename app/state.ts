export type State = {
  mode: string;
  data?: Record<string, any>;
  lastFetch?: Date;
};

let currentState: State = { mode: 'offline' };

export function getState() {
  return currentState;
}

export function setState(newState: State) {
  currentState = newState;
}
