export interface PositionQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
  wordLimit?: number;
}

export interface ApplicationPosition {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
}

export const APPLICATION_POSITIONS: ApplicationPosition[] = [
  {
    id: 'SAC President',
    title: 'SAC President',
    shortDescription: 'Leads meetings, major events, council operations, and overall SAC direction.',
    fullDescription: 'The SAC President leads the entire council by running meetings, planning major school events, coordinating with staff/admin, overseeing council operations and budgeting, supporting members, resolving conflicts, and representing SAC in leadership initiatives. They set the overall tone, direction, and vision of the council through strong leadership and organization.'
  },
  {
    id: 'SAC Vice President',
    title: 'SAC Vice President',
    shortDescription: 'Supports the President and helps keep meetings, logistics, and morale on track.',
    fullDescription: 'The SAC Vice-President acts as the President’s main support and second-in-command, helping lead meetings, events, logistics, communication, budgeting, and council operations. They step in when needed and help maintain council morale, accountability, and smooth collaboration between students, staff, and executives.'
  },
  {
    id: 'SAC Social Convenor',
    title: 'SAC Social Convenor',
    shortDescription: 'Organizes dances, promotions, spirit days, and other SAC social events.',
    fullDescription: 'The SAC Social Convenor is responsible for organizing and supervising social events such as dances and other SAC activities. They coordinate vendors, promotions, spirit days, and event logistics while working closely with executives, staff, and grade representatives.'
  },
  {
    id: 'SAC Treasurer',
    title: 'SAC Treasurer',
    shortDescription: 'Handles SAC budgets, cash systems, funding, and financial organization.',
    fullDescription: 'The SAC Treasurer manages SAC finances and funding-related tasks, including school cash systems, club funding, event money handling, budgeting paperwork, and financial organization. They also coordinate cash collection/counting and maintain communication with the school’s budget staff.'
  }
];

const SHARED_QUESTIONS = [
  {
    id: 'honorary_2',
    question: 'What is your platform? Or in other words, what goals, ideas, and changes do you hope to bring to the council, the student body, and/or the position? (250 words MAX)',
    type: 'textarea' as const,
    required: true,
    wordLimit: 250,
  },
  {
    id: 'honorary_3',
    question: 'Reach out to two John Fraser teachers that would support you in this position. Please include their name and email (Cannot be Ms.Sinclair or Ms.Mortenson)',
    type: 'textarea' as const,
    required: true,
    wordLimit: 10,
  },
];

export const getQuestionsForPosition = (position: string): PositionQuestion[] => [
  {
    id: 'honorary_1',
    question: `Why do you wish to become ${position}, and why are you the most deserving candidate in doing so? (200 words MAX)`,
    type: 'textarea',
    required: true,
    wordLimit: 200,
  },
  ...SHARED_QUESTIONS,
];

export const getQuestionCountForPosition = (position: string): number =>
  getQuestionsForPosition(position).length;
