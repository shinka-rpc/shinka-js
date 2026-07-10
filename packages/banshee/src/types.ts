export type BansheeEventListener = () => void;
export type ManageEventListener = (target: BansheeEventListener) => void;
export type BansheeEnvironment = {
  add: ManageEventListener;
  rm: ManageEventListener;
};
export type OnBansheeWail = () => void;
