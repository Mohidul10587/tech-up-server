/** The only courses currently offered by the training centre. */
export const COURSE_NAMES = ['Mobile Repairing', 'English Speaking'] as const;
export type CourseName = (typeof COURSE_NAMES)[number];
