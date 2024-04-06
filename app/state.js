let currentState = { mode: 'offline' };

export function getState() {
  return currentState;
}

export function setState(newState) {
  currentState = newState;
}
