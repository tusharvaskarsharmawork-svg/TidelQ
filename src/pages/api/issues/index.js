import { getIssues, createIssue } from '../../../lib/issues_db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const issues = await getIssues();
      return res.status(200).json(issues);
    } catch (error) {
      console.error('[API] Error fetching issues:', error);
      return res.status(500).json({ error: 'Failed to fetch issues' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, beach_id, category, image_url, created_by } = req.body;
      
      if (!title || !beach_id) {
        return res.status(400).json({ error: 'Missing required fields: title, beach_id' });
      }

      const newIssue = await createIssue({
        title,
        description,
        beach_id,
        category,
        image_url,
        created_by: created_by || 'anon',
      });

      return res.status(201).json(newIssue);
    } catch (error) {
      console.error('[API] Error creating issue:', error);
      return res.status(500).json({ error: 'Failed to create issue' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
