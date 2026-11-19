export const enum StateType {
  IDLE = 0,
  REQUESTED = 1,
  LOCKED_LOCAL = 2,
  LOCKED_REMOTE = 3,
  RACE_WON_1 = 4, // MY MOVE
  RACE_WON_2 = 5, // OTHERS MOVE
  RACE_LOSE_1 = 6, // OTHERS MOVE
  RACE_LOSE_2 = 7, // MY MOVE
}

export const enum FSMEventType {
  STOP = 1,
  LOCAL_ACQUIRE = 2,
  REMOTE_ACQUIRE = 3,
  ACCEPT = 4,
  LOCAL_RELEASE = 5,
  REMOTE_RELEASE = 6,
  TIMEOUT = 7,
}
