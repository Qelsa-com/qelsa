export type JobApplicationAnswer = {
  id: number;
  job_application_id: number;
  job_id: number;
  user_id: number;
  question_id: number;
  question: string;
  answer: string;
  /** Whether the underlying screening question is a knockout question. */
  is_knockout?: boolean | null;
  /**
   * Whether this answer satisfies the question's expected answer / knockout rule.
   * `true` = meets, `false` = does not meet, `null`/absent = not evaluated (e.g. open text).
   */
  meets_requirement?: boolean | null;
  createdAt: string;
  updatedAt: string;
};