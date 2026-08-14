import { Education } from "./education";
import { User } from "./user";

export type Achievement = {
  id?: number;
  title: string;
  user?: User;
  education?: Education;
};
