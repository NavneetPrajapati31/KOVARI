import { http } from 'msw';

export const handlers = [
  http.get('/supabase', () => {
    return new Response(JSON.stringify({ data: [] }));
  }),
];
