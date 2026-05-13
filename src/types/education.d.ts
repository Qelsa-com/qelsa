import { Achievement } from "./achievement";
import { DegreeName } from "./degreeName";
import { FieldOfStudy } from "./fieldOfStudy";
import { Project } from "./project";

export type Education = {
  id?: number;
  degree?: DegreeName;
  institution?: string;
  field_of_study?: FieldOfStudy;
  start_year?: number;
  end_year?: number;
  grade?: string;
  description?: string;
  location?: string;
  projects?: Project[];
  achievements?: Achievement[];
};
