import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Gated: Only ACTIVE approved users can access chat
router.use(authenticate);

router.get('/threads', (req, res) => {
  return res.status(200).json({
    success: true,
    data: []
  });
});

router.get('/:matchId/messages', (req, res) => {
  return res.status(200).json({
    success: true,
    data: []
  });
});

router.post('/:matchId/messages', (req, res) => {
  const { content, messageType = 'text' } = req.body;
  const message = {
    id: `msg_${Date.now()}`,
    matchId: req.params.matchId,
    senderId: req.user.id,
    content,
    messageType,
    createdAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    data: message
  });
});

export default router;
