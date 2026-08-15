import { Education } from "./education";
import { User } from "./user";

export type Project = {
  id?: number;
  title: string;
  user?: User;
  education?: Education;
};
