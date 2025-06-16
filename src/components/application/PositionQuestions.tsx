import React from 'react';

interface PositionQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
}

const positionQuestions: Record<string, PositionQuestion[]> = {
  'Secretary': [
    {
      id: 'secretary-1',
      question: 'What organizational skills and experience do you have that would make you an effective Secretary for SAC?',
      type: 'textarea',
      required: true
    },
    {
      id: 'secretary-2', 
      question: 'How would you ensure accurate record-keeping and effective communication within the council?',
      type: 'textarea',
      required: true
    },
    {
      id: 'secretary-3',
      question: 'Describe a time when you had to manage multiple tasks or deadlines simultaneously. How did you prioritize and organize your work?',
      type: 'textarea',
      required: true
    }
  ],
  'Treasurer': [
    {
      id: 'treasurer-1',
      question: 'What experience do you have with budgeting, financial planning, or managing money for organizations or events?',
      type: 'textarea',
      required: true
    },
    {
      id: 'treasurer-2',
      question: 'How would you ensure transparency and accountability in SAC\'s financial operations?',
      type: 'textarea', 
      required: true
    },
    {
      id: 'treasurer-3',
      question: 'Describe your approach to tracking expenses and maintaining accurate financial records.',
      type: 'textarea',
      required: true
    }
  ],
  'Community Outreach': [
    {
      id: 'outreach-1',
      question: 'What experience do you have in community engagement, volunteering, or organizing community events?',
      type: 'textarea',
      required: true
    },
    {
      id: 'outreach-2',
      question: 'How would you identify and build relationships with community partners and local organizations?',
      type: 'textarea',
      required: true
    },
    {
      id: 'outreach-3',
      question: 'Describe a successful project or initiative you\'ve been involved in that brought people together or served the community.',
      type: 'textarea',
      required: true
    }
  ],
  'Athletics Liaison': [
    {
      id: 'athletics-1',
      question: 'What is your experience with sports, athletics, or fitness activities at Fraser Heights or in the community?',
      type: 'textarea',
      required: true
    },
    {
      id: 'athletics-2',
      question: 'How would you promote athletic participation and school spirit around sports events?',
      type: 'textarea',
      required: true
    },
    {
      id: 'athletics-3',
      question: 'Describe how you would work with coaches, athletes, and the athletic department to support student athletes.',
      type: 'textarea',
      required: true
    }
  ],
  'Promotions Officer': [
    {
      id: 'promotions-1',
      question: 'What experience do you have with marketing, social media, graphic design, or promoting events?',
      type: 'textarea',
      required: true
    },
    {
      id: 'promotions-2',
      question: 'How would you create engaging content and campaigns to promote SAC events and initiatives?',
      type: 'textarea',
      required: true
    },
    {
      id: 'promotions-3',
      question: 'Describe a time when you successfully promoted an event, project, or idea. What strategies did you use?',
      type: 'textarea',
      required: true
    }
  ],
  'Photography Exec': [
    {
      id: 'photography-1',
      question: 'What photography experience do you have, including equipment familiarity and editing skills?',
      type: 'textarea',
      required: true
    },
    {
      id: 'photography-2',
      question: 'How would you ensure comprehensive documentation of SAC events while being unobtrusive during activities?',
      type: 'textarea',
      required: true
    },
    {
      id: 'photography-3',
      question: 'Describe your workflow for organizing, editing, and sharing photos efficiently after events.',
      type: 'textarea',
      required: true
    }
  ],
  'Technology Executive': [
    {
      id: 'tech-1',
      question: 'Being the Technology Executive will not be easy work — and it\'s much more than simply operating the cafeteria tech booth or updating the SAC website. We are looking for someone truly passionate about using technology to solve problems and make a meaningful impact on the school. FraserPay is a great example: it took months of effort to develop but ultimately enabled SAC to process over $13,000 during Charity Week.\nWhy do you want to be the Technology Executive, and what motivates you to contribute to SAC in this capacity?',
      type: 'textarea',
      required: true
    },
    {
      id: 'tech-2',
      question: 'Our current suite of platforms — FraserPay, FraserVotes, and FraserSAP — are built using TypeScript, HTML, and CSS. They\'re hosted on Vercel and use Firebase as their backend.\nHow confident are you in your ability to work with, or learn to work with, these technologies in order to maintain, operate, and improve these systems?',
      type: 'textarea',
      required: true
    },
    {
      id: 'tech-3',
      question: 'Tell us about a time you saw a problem and used technology to solve it — whether it was for a school event, a personal project, or something else. What was the challenge, what did you build or improve, and what impact did it have?',
      type: 'textarea',
      required: true
    },
    {
      id: 'tech-4',
      question: 'SAC pays for and provides any resource you need to develop useful programs at our teacher supervisors discretion. Knowing this, if you could build any program for SAC, or the greater school community — what would it be and why?',
      type: 'textarea',
      required: true
    }
  ],
  'Arts Liaison': [
    {
      id: 'arts-1',
      question: 'What experience do you have with visual arts, performing arts, music, drama, or other creative activities?',
      type: 'textarea',
      required: true
    },
    {
      id: 'arts-2',
      question: 'How would you promote and support arts programs and events within the school community?',
      type: 'textarea',
      required: true
    },
    {
      id: 'arts-3',
      question: 'Describe how you would collaborate with arts teachers, drama club, band, and other creative groups to enhance arts programming.',
      type: 'textarea',
      required: true
    }
  ]
};

export default positionQuestions;
