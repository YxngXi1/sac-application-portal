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
  'Honourary Member': [
    {
      id: 'honorary_1',
      question: 'Tell us your "why" - why do you want to be a part of the Student Activity Council for the 2025-26 school year?',
      type: 'textarea' as const,
      required: true,
      wordLimit: 100,
    },
    {
      id: 'honorary_2',
      question: 'What unique qualities, skills, or assets make you a very valuable member to the council? In other words, why should we choose you over other applicants?',
      type: 'textarea' as const,
      required: true,
      wordLimit: 150,
    },
    {
      id: 'honorary_3',
      question: "Describe a time when your group's 'perfect plan' faced a setback. How did your group overcome this obstacle and what was your role in doing so?",
      type: 'textarea' as const,
      required: true,
      wordLimit: 150,
    },
    {
      id: 'honorary_4',
      question: "Imagine you're given a magic wand that instantly makes only TWO changes to school life. What are your two spells and how would it benefit life at John Fraser. Be specific by also including the overall goal and impact of your changes.",
      type: 'textarea' as const,
      required: true,
      wordLimit: 200,
    },
    {
      id: 'honorary_5',
      question: 'What are your other commitments that you are in or plan to be in, both in and out of school? Please write down your role, time commitment per week, and the day(s) of the week if applicable. Jot notes only.',
      type: 'textarea' as const,
      required: true,
      wordLimit: 100,
    },
  ],
};

export default positionQuestions;