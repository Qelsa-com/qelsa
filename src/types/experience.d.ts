import { Responsibility } from "./responsibility";
import { UserSkill } from "./userSkill";

export type Experience = {
  id?: number;
  company_name: string;
  position: string;
  employment_type?: string;
  start_date: Date;
  end_date?: Date;
  is_current?: boolean;
  description?: string;
  location?: string;
  title?: string;
  team_size?: number;
  is_current?: boolean;
  responsibilities?: Responsibility[];
  skills?: UserSkill[];
};
