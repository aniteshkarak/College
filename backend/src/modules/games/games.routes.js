import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { success } from '../../utils/response.js';

const router = Router();

// 6 Interactive Conversation Games metadata
const GAMES_LIST = [
  { id: 'game_20q', name: '20 Questions', category: 'Icebreaker', minPlayers: 2 },
  { id: 'game_wyr', name: 'Would You Rather?', category: 'Fun', minPlayers: 2 },
  { id: 'game_hot_takes', name: 'Campus Hot Takes', category: 'Debate', minPlayers: 2 },
  { id: 'game_trivia', name: 'Pop & Campus Trivia', category: 'Trivia', minPlayers: 2 },
  { id: 'game_deep', name: 'Deep Reflections', category: 'Vibe Check', minPlayers: 2 },
  { id: 'game_emoji', name: 'Emoji Story Decoders', category: 'Casual', minPlayers: 2 },
];

router.get('/', requireAuth, (_req, res) => {
  return success(res, { games: GAMES_LIST }, 'Available conversation games');
});

export default router;
