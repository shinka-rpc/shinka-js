type HasPush<T> = {
  push: (val: T) => void;
};

export const qPush10 = (q: HasPush<number>) => {
  // pseudo-random push
  q.push(5);
  q.push(1);
  q.push(7);
  q.push(3);
  q.push(9);
  q.push(6);
  q.push(0);
  q.push(2);
  q.push(8);
  q.push(4);
};
