export type State = {
  id: number | string;
  name: string;
};

export type City = {
  id: number | string;
  name: string;
  state_id?: number | string;
  state?: State;
};
