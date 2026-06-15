import figlet from 'figlet';
import index from './index.html';

const server = Bun.serve({
  port: 3000,
  routes: {
    '/': index,
    '/figlet': {
      GET: async (req) => {
        const query = new URLSearchParams(req.url.split('?')[1]);
        const text = query.get('text') || 'Bun!';
        const body = figlet.textSync(text);
        return new Response(body);
      },
      POST: async (req) => {
        const body = await req.text();
        return new Response(body);
      },
    },
  },
});

console.log(`Listening on ${server.url}`);
