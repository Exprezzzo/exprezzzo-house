import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Metrics {
  cost: number;
  latency: number;
  provider: string;
}

export class SessionManager {
  private readonly TTL = 3600; // 1 hour
  
  async saveConversation(sessionId: string, messages: Message[]) {
    await redis.setex(
      `session:${sessionId}`,
      this.TTL,
      JSON.stringify(messages)
    );
  }
  
  async getConversation(sessionId: string): Promise<Message[]> {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : [];
  }
  
  async updateMetrics(sessionId: string, metrics: Metrics) {
    await redis.hincrby('metrics:requests', 'total', 1);
    await redis.hincrbyfloat('metrics:costs', 'total', metrics.cost);
    await redis.zadd('metrics:sessions', Date.now(), sessionId);
    await redis.hincrby(`metrics:providers`, metrics.provider, 1);
  }
}

export default new SessionManager();
