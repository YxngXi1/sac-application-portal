import React from 'react';

interface PositionQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
  wordLimit?: number;
}

const positionQuestions = {
  'Grade Rep': [
    {
      id: 'honorary_1',
      question: 'Tell us your "why" - why do you want to be a Grade Representative in the 2025-26 school year?',
      type: 'textarea' as const,
      required: true,
      wordLimit: 100,
    },
    {
      id: 'honorary_2',
      question: "What is your platform? In other words, what ideas, initiatives, or changes would you like to introduce, and how will it benefit the student body?",
      type: 'textarea' as const,
      required: true,
      wordLimit: 150,
    },
    {
      id: 'honorary_3',
      question: "As a Grade Rep, communication is key. How will you actively represent and voice your grade's ideas and opinions during SAC meetings, events, and spirit weeks? Please be specific.",
      type: 'textarea' as const,
      required: true,
      wordLimit: 150,
    },
    {
      id: 'honorary_4',
      question: 'What are your other commitments that you are in or plan to be in, both in and out of school? Please write down your role, time commitment per week, and the day(s) of the week if applicable. Jot notes only.',
      type: 'textarea' as const,
      required: true,
      wordLimit: 150,
    },
    {
      id: 'honorary_5',
      question: 'Do you know anyone currently on the SAC Executive Council?',
      type: 'textarea' as const,
      required: false,
      wordLimit: 100,
    },
    {
      id: 'honorary_6',
      question: 'Which 2 John Fraser teachers support you as a SAC Grade Representative. Include their name and emails.',
      type: 'textarea' as const,
      required: true,
      wordLimit: 100,
    },
  ],
};

export default positionQuestions;