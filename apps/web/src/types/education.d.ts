import { Achievement } from "./achievement";
import { City } from "./city";
import { DegreeName } from "./degreeName";
import { FieldOfStudy } from "./fieldOfStudy";
import { Project } from "./project";

export type College = {
  id: number;
  name: string;
  state?: string;
  district?: string;
};

export type Education = {
  id?: string | number;
  degree?: DegreeName;
  college?: College;
  field_of_study?: FieldOfStudy;
  start_year?: number;
  end_year?: number;
  grade?: string;
  description?: string;
  city?: City;
  projects?: Project[];
  achievements?: Achievement[];
};
