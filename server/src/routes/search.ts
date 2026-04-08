import { Router, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/web', async (req: AuthRequest, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();
    const limit = Math.min(Number(req.query.limit || 8), 15);
    const apiKey = (process.env.SEARCHAPI_API_KEY || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'Search API key is not configured',
        hint: 'Set SEARCHAPI_API_KEY in your environment',
      });
    }

    const { data } = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        engine: 'google',
        q: query,
        api_key: apiKey,
        hl: String(req.query.hl || 'en'),
        gl: String(req.query.gl || 'us'),
      },
      timeout: 15000,
      headers: {
        Accept: 'application/json',
      },
    });

    const organicResults = Array.isArray(data?.organic_results) ? data.organic_results : [];
    const answerBoxResult = data?.answer_box?.organic_result ? [data.answer_box.organic_result] : [];
    const mergedResults = [...answerBoxResult, ...organicResults].slice(0, limit);

    const results = mergedResults.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      title: item?.title || 'Untitled',
      url: item?.link || '',
      snippet: item?.snippet || item?.source || '',
      type: 'web',
      relevance: Math.max(40, 100 - index * 7),
    })).filter((item: any) => item.url);

    return res.json({ results, provider: 'searchapi' });
  } catch (error: any) {
    const status = error?.response?.status;
    const upstreamMessage = error?.response?.data?.error || error?.response?.data?.message;
    console.error('[SEARCH] SearchAPI request failed:', status, upstreamMessage || error?.message || error);

    return res.status(502).json({
      error: 'Failed to fetch search results',
      details: upstreamMessage || error?.message || 'Unknown search provider error',
    });
  }
});

export default router;
