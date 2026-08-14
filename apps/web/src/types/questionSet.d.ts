import { ScreeningQuestion } from "./question";

export interface QuestionSet {
  id?: any;
  jobId: number;
  ownerId: number;
  title: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  questions?: ScreeningQuestion[];
}
