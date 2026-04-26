import { Option } from "./option";

export interface ScreeningQuestion {
  id?: any;
  type: "multiple_choice" | "yes_no" | "scale" | "short_text" | "short-answer" | "coding" | "behavioral";
  title: string;
  required: boolean;
  is_knockout: boolean;
  weight: number;
  correct_answer_id?: string | number;
  min_value?: number;
  max_value?: number;
  knockout_condition?: "equals" | "less-than" | "greater-than" | "contains";
  knockout_value?: string | number;
  max_length?: number;
  options?: (Option | string)[];
}
