import { City } from "./city";
import { Company } from "./company";
import { ImpactMetric } from "./impactMetric";
import { JobTitle } from "./jobTitle";
import { Responsibility } from "./responsibility";
import { Skill } from "./userSkill";

export type Experience = {
  id?: string | number;
  company?: Company;
  job_title?: JobTitle;
  employment_type?: string;
  work_type?: string;
  start_date: Date;
  end_date?: Date;
  is_current?: boolean;
  description?: string;
  city?: City;
  position?: string;
  team_size?: number;
  responsibilities?: Responsibility[];
  impact_metrics?: ImpactMetric[];
  skills?: Skill[];
};
