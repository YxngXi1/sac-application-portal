import React from 'react';

interface PositionQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
}

const positionQuestions = {
  'Honourary Member': [
    {
      id: 'honorary_1',
      question: 'Why do you want to become an honourary member of the Student Activity Council?',
      type: 'textarea' as const,
      required: true,
    },
    {
      id: 'honorary_2',
      question: 'What experience do you have in leadership, teamwork, or community involvement?',
      type: 'textarea' as const,
      required: true,
    },
    {
      id: 'honorary_3',
      question: 'How would you contribute to SAC events and initiatives? Describe specific ways you could help.',
      type: 'textarea' as const,
      required: true,
    },
    {
      id: 'honorary_4',
      question: 'What ideas do you have to improve student life at John Fraser?',
      type: 'textarea' as const,
      required: true,
    },
    {
      id: 'honorary_5',
      question: 'What other commitments do you plan to have this year? Include clubs, sports, part-time jobs, and estimated time per week.',
      type: 'textarea' as const,
      required: true,
    },
  ],
};

export default positionQuestions;