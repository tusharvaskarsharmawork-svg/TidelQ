import { toggleVote } from '../../../lib/issues_db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { issue_id, user_id } = req.body;
      
      if (!issue_id || !user_id) {
        return res.status(400).json({ error: 'Missing required fields: issue_id, user_id' });
      }

      const result = await toggleVote(user_id, issue_id);
      return res.status(200).json(result);
    } catch (error) {
      console.error('[API] Error voting on issue:', error);
      return res.status(500).json({ error: 'Failed to cast vote' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
