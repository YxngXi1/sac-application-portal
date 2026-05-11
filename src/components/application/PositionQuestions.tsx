import { APPLICATION_POSITIONS, getQuestionsForPosition } from '@/lib/applicationConfig';

const positionQuestions = Object.fromEntries(
  APPLICATION_POSITIONS.map((position) => [position.id, getQuestionsForPosition(position.id)])
);

export default positionQuestions;
