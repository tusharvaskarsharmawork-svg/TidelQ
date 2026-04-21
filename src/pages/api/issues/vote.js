import { voteIssue } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { issue_id, user_id, vote_type } = req.body;
      
      if (!issue_id || !user_id || vote_type === undefined) {
        return res.status(400).json({ error: 'Missing required fields: issue_id, user_id, vote_type' });
      }

      if (vote_type !== 1 && vote_type !== -1 && vote_type !== 0) {
        return res.status(400).json({ error: 'vote_type must be 1, -1, or 0' });
      }

      const result = await voteIssue(user_id, issue_id, vote_type);
      return res.status(200).json(result);
    } catch (error) {
      console.error('[API] Error voting on issue:', error);
      return res.status(500).json({ error: 'Failed to cast vote' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
