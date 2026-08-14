export type State = {
  id: number;
  name: string;
};

export type City = {
  id: number;
  name: string;
  state_id?: number;
  state?: State;
};
