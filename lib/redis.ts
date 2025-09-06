import Redis from 'redis';

export const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

export async function addMessageToSession(sessionId: string, role: 'user' | 'assistant', content: string) {
  const entry = { role, content };
  await redisClient.rPush(`session:${sessionId}`, JSON.stringify(entry));
}

export async function getSessionHistory(sessionId: string): Promise<{ role: string, content: string }[]> {
  const messages = await redisClient.lRange(`session:${sessionId}`, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
}
