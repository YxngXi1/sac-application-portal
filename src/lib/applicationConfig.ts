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
/*

  {
    id: 'Secretary',
    title: 'Secretary',
    shortDescription: 'Keeps SAC organized through notes, communication, and accountability systems.',
    fullDescription: 'The Secretary helps SAC run smoothly by keeping accurate records, managing communication, tracking attendance, and making sure the council stays organized and accountable throughout the year.',
  },
  {
    id: 'Clubs Liaison',
    title: 'Clubs Liaison',
    shortDescription: 'Supports clubs, coordinates club initiatives, and improves club operations across the school.',
    fullDescription: 'The Clubs Liaison works with student clubs to support their growth, coordinate key initiatives, and improve systems related to club funding, promotion, Super Council meetings, and overall club activity management.',
  },
  {
    id: 'Promotion Officer',
    title: 'Promotion Officer',
    shortDescription: 'Leads promotional content creation for SAC events through video, posters, and campaign design.',
    fullDescription: 'The Promotion Officer helps shape SAC’s public-facing identity by creating engaging promotional materials, supporting event marketing, and using visuals and media to build school excitement around major initiatives.',
  },
  {
    id: 'Community Outreach',
    title: 'Community Outreach',
    shortDescription: 'Builds meaningful connections between SAC, the school, and the wider community.',
    fullDescription: 'Community Outreach focuses on planning initiatives that connect the school with the wider community, encourage participation, and create meaningful impact through projects such as food drives, charity efforts, and service-based campaigns.',
  },
  {
    id: 'Tech Liaison',
    title: 'Tech Liaison',
    shortDescription: 'Improves SAC’s digital tools, systems, and online presence.',
    fullDescription: 'The Tech Liaison supports SAC through digital problem-solving, helping improve the website, internal tools, event workflows, sign-ups, automation, and the overall technical experience behind council operations.',
  },
  {
    id: 'Athletics Liaison',
    title: 'Athletics Liaison',
    shortDescription: 'Connects SAC and Athletics Council while helping organize collaborative spirit events.',
    fullDescription: 'The Athletics Liaison keeps communication strong between SAC and the Athletics Council while helping plan collaborative events that promote school spirit, student engagement, and strong coordination between both groups.',
  },
  {
    id: 'Arts Liaison',
    title: 'Arts Liaison',
    shortDescription: 'Represents the arts community within SAC and helps increase visibility for arts programs.',
    fullDescription: 'The Arts Liaison connects SAC with the arts community by advocating for arts students, supporting arts programming, and helping increase visibility and recognition for arts initiatives across the school.',
  },
  {
    id: 'Photography Exec',
    title: 'Photography Exec',
    shortDescription: 'Captures SAC events and builds a strong visual record of student life.',
    fullDescription: 'The Photography Exec documents SAC events through strong photo coverage, creative visual storytelling, and thoughtful editing, helping preserve school memories and support SAC’s promotional presence throughout the year.',
  },

*/

  {
    id: 'Honourary Member',
    title: 'Honourary Member',
    shortDescription: 'Student Leaders who go above and beyond to support school life by helping plan, promote, and execute SAC events.',
    fullDescription: 'Honourary Members represent SAC at school events and initiatives, supporting the planning, promotion, and execution of activities throughout the year. They contribute ideas, collaborate with council members, and help create engaging experiences that strengthen student life and school spirit.',
  },
];

const OVERALL_QUESTION = (position: string): PositionQuestion => ({
  id: 'overall_motivation',
  question:
    position === 'Honourary Member'
      ? 'Why do you wish to become an SAC Honourary Member, and what do you hope to contribute to SAC in this role? (150 words MAX)'
      : `Why do you wish to become an SAC Executive, and why do you choose the ${position} position specifically? (150 words MAX)`,
  type: 'textarea',
  required: true,
  wordLimit: 150,
});

const COMMITMENTS_QUESTION: PositionQuestion = {
  id: 'other_commitments',
  question:
    'What other commitments/extracurriculars do you plan to take on for next year? Please list the activity, your position, and the weekly time commitment.\nEx) JFSS Soccer Team - Player - 4 hours/week',
  type: 'textarea',
  required: true,
};

const getTeacherSupportQuestion = (position: string): PositionQuestion => ({
  id: 'teacher_references',
  question:
    position === 'Athletics Liaison' || position === 'Arts Liaison'
      ? 'Reach out to two John Fraser teachers that would support you in this position. Please include their name and email.\nFor this role, one of the teachers must be the teacher supervisor of the other club.'
      : 'Reach out to two John Fraser teachers that would support you in this position. Please include their name and email.',
  type: 'textarea',
  required: true,
});

// Honourary Member gets its own dedicated 5-question set (matches the
// Honourary Application Rubric exactly) instead of going through the
// shared OVERALL_QUESTION / COMMITMENTS_QUESTION / teacher-refs pipeline.
// See getQuestionsForPosition below.
const HONOURARY_QUESTIONS: PositionQuestion[] = [
  {
    id: 'why_join_sac',
    question:
      'Tell us your "why" - why do you want to be a part of the Student Activity Council for the 2026-27 school year? (100 words MAX)',
    type: 'textarea',
    required: true,
    wordLimit: 100,
  },
  {
    id: 'unique_qualities',
    question:
      'What unique qualities, skills, or assets make you a very valuable member to the council? In other words, why should we choose you over other applicants? (150 words MAX)',
    type: 'textarea',
    required: true,
    wordLimit: 150,
  },
  {
    id: 'other_commitments',
    question:
      'What are your other commitments that you are in or plan to be in both in and out of school. Please write down your role, time commitment per week, and the day(s) of the week if applicable. Jot Notes Only.',
    type: 'textarea',
    required: true,
  },
  {
    id: 'setback_story',
    question:
      "Describe a time when your group's 'perfect plan' faced a setback. How did your group overcome this obstacle and what was your role in doing so? (150 words MAX)",
    type: 'textarea',
    required: true,
    wordLimit: 150,
  },
  {
    id: 'song_book_movie',
    question:
      'If you had to pick a song/book/movie/TV show/play to describe yourself, what would it be and why? (100 words MAX)',
    type: 'textarea',
    required: true,
    wordLimit: 100,
  },
];

const POSITION_SPECIFIC_QUESTIONS: Record<string, PositionQuestion[]> = {
  Secretary: [
    {
      id: 'organization_systems',
      question:
        'Organization is a critical component of the Secretary role. Describe the strategies, habits, or systems you currently use to stay organized, and explain how these approaches would help you succeed in managing the responsibilities of a Secretary? (200 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 200,
    },
    {
      id: 'attendance_and_accountability',
      question:
        'Beyond recording information, the Secretary helps maintain structure and accountability within SAC. How would you ensure that council members are attending all SAC meetings and events, while balancing the responsibilities of writing-up announcements, sending emails, and recording meeting notes?',
      type: 'textarea',
      required: true,
    },
  ],
  'Clubs Liaison': [
    {
      id: 'club_leadership_experience',
      question:
        'Describe at least one leadership position you held in a club at John Fraser. What aspects of the club did you enjoy most, and how did your experience inspire you to apply for the role of Clubs Liaison? (200 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 200,
    },
    {
      id: 'clubs_platform',
      question:
        'What is your platform? Or in other words, what improvements would you bring to the role of Clubs Liaison to better manage the overall club activities? This may include but is not limited to: Super Council meetings, club funding/proposals, Club Promo Lunch, etc. (250 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 250,
    },
  ],
  'Promotion Officer': [
    {
      id: 'fear_fest_video',
      question:
        "Using the photos/clips we've provided in this folder (https://drive.google.com/drive/folders/115-7d1uzB_MMbdVoXZRsuNXkHnIejnEL?usp=drive_link), create a promotional video for Fraser's Fear Fest. Feel free to use the Fear Fest video on our Instagram @johfrasersac as an inspiration for your own! (Video length: 45 seconds MAX)\n\nPlease attach a link to the video, or email it to 793546@pdsb.net & 843909@pdsb.net",
      type: 'textarea',
      required: true,
    },
    {
      id: 'fear_fest_poster',
      question:
        "Using the information and the photos we've provided in this folder (https://drive.google.com/drive/folders/12NOJQoQFMqRL5yCuIpCuED-ys2omagVe?usp=drive_link), create a poster for Fraser's Fear Fest. Feel free to use the Fear Fest poster on our Instagram @johfrasersac as an inspiration for your own!\n\nPlease attach a link to the poster, or email it to 793546@pdsb.net & 843909@pdsb.net",
      type: 'textarea',
      required: true,
    },
  ],
  'Community Outreach': [
    {
      id: 'community_impact',
      question:
        'One of the responsibilities of Community Outreach is creating meaningful connections between the school and the wider community through many initiatives such as the Food Drive and Charity Week. Describe how you would encourage student participation and ensure that these events create a meaningful impact on both the school and the community? (200 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 200,
    },
    {
      id: 'community_experience',
      question:
        'Describe a role or position you have held within the community, such as volunteer work, a non-profit organization, or another outreach initiative. What experiences, skills, or ideas did you gain from that role, and how would they help you succeed as Community Outreach? (250 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 250,
    },
  ],
  'Tech Liaison': [
    {
      id: 'project_tradeoffs',
      question:
        "Share a project you've built (web development preferred) by including a link or repository. Walk us through the tradeoffs you made during the build and what you learned from the process. (250 words MAX)",
      type: 'textarea',
      required: true,
      wordLimit: 250,
    },
    {
      id: 'tech_platform',
      question:
        "What is your platform? In other words, what improvements or new ideas would you bring to SAC's digital presence and tools (e.g. the website, internal systems, event sign-ups, automation)? (250 words MAX)",
      type: 'textarea',
      required: true,
      wordLimit: 250,
    },
  ],
  'Athletics Liaison': [
    {
      id: 'athletics_communication',
      question:
        'Strong communication between the Student Council and the Athletics Council is crucial throughout the school year. Explain how you would maintain clear and consistent communication as the Athletics Liaison. (150 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 150,
    },
    {
      id: 'athletics_event_proposal',
      question:
        'The Athletics Liaison helps organize events, such as Fraser Games, that promote school spirit and collaboration between the Student Activity Council and the Athletics Council. Propose a new event that would encourage student engagement while requiring collaboration between both councils. Explain how the event would work and why a collaboration is needed. (300 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 300,
    },
  ],
  'Arts Liaison': [
    {
      id: 'arts_communication',
      question:
        'Strong communication between the Student Activity Council and the Arts Council is crucial throughout the school year. Explain how you would maintain clear and consistent communication as the Arts Liaison. (200 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 200,
    },
    {
      id: 'arts_advocacy',
      question:
        'The Arts Liaison represents the interests of the arts community within SAC and helps ensure arts programs and students receive support and visibility. How would you advocate for the arts and raise their profile within the school? (200 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 200,
    },
  ],
  'Photography Exec': [
    {
      id: 'photo_folder_link',
      question:
        'Share any five of your favourite photos you have taken via a Google Drive folder.\n\nPlease attach a link to the folder, or email it to 793546@pdsb.net & 843909@pdsb.net',
      type: 'textarea',
      required: true,
    },
    {
      id: 'favorite_photo_reasoning',
      question:
        'Choose your favourite photo from the five you submitted, and explain the reasoning behind your decision in choosing this photo. (150 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 150,
    },
    {
      id: 'gear_and_editing',
      question:
        'What gear and editing software do you use, and how do you approach taking photos? (150 words MAX)',
      type: 'textarea',
      required: true,
      wordLimit: 150,
    },
  ],
};

export const getQuestionsForPosition = (position: string): PositionQuestion[] => {
  if (position === 'Honourary Member') {
    return HONOURARY_QUESTIONS;
  }

  const positionSpecificQuestions = POSITION_SPECIFIC_QUESTIONS[position] || [];

  return [
    OVERALL_QUESTION(position),
    ...positionSpecificQuestions,
    COMMITMENTS_QUESTION,
    getTeacherSupportQuestion(position),
  ];
};

export const getQuestionCountForPosition = (position: string): number =>
  getQuestionsForPosition(position).length;