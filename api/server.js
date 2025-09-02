import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import pg from 'pg';
import Redis from 'redis';
import { Ollama } from 'ollama';
import { createLogger, format, transports } from 'winston';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: '.env.local' });

const logger = createLogger({
    format: format.combine(format.timestamp(), format.colorize(), format.simple()),
    transports: [new transports.Console()]
});

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000
});

const redis = Redis.createClient({ url: process.env.REDIS_URL });
redis.on('error', err => logger.error('Redis error:', err));
await redis.connect();

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL });

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://exprezzzo.com', 'https://www.exprezzzo.com']
        : ['http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json({ limit: '10mb' }));

const sovereignLimiter = rateLimit({
    windowMs: 60000,
    max: 100,
    handler: async (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip}`);
        res.status(429).json({
            error: 'Rate limit exceeded',
            sovereignty: 'preserved',
            fallback: 'Direct Ollama at localhost:11434'
        });
    }
});
app.use('/api', sovereignLimiter);

const enforceSovereignty = async (req, res, next) => {
    const cost = req.body.estimatedCost || 0;
    if (cost > parseFloat(process.env.MAX_COST_PER_REQUEST)) {
        return res.status(403).json({
            error: 'Exceeds sovereignty cost limit',
            maxAllowed: process.env.MAX_COST_PER_REQUEST,
            requested: cost,
            sovereignty: 'enforced'
        });
    }
    next();
};

const prePriceRequest = (tokens) => {
    return tokens * 0.000001;
};

app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT 1');
        const redisCheck = await redis.ping();
        const ollamaCheck = await ollama.list();
        
        res.json({
            status: 'sovereign',
            house: 'EXPREZZZO',
            services: {
                database: dbCheck.rows.length > 0,
                cache: redisCheck === 'PONG',
                llm: ollamaCheck.models.length > 0,
                models: ollamaCheck.models.map(m => m.name)
            },
            sovereignty: {
                mode: process.env.SOVEREIGNTY_MODE,
                maxCost: process.env.MAX_COST_PER_REQUEST,
                localFirst: process.env.LOCAL_FIRST === 'true'
            },
            brand: {
                gold: process.env.BRAND_GOLD,
                chocolate: process.env.BRAND_CHOCOLATE
            }
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ status: 'degraded', error: error.message });
    }
});

app.get('/api/sovereignty', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sovereignty_scores ORDER BY sovereignty_score DESC'
        );
        res.json({
            vendors: result.rows,
            recommendation: 'Prioritize vendors with score >= 0.90',
            escapeProtocol: 'Docker compose ready'
        });
    } catch (error) {
        logger.error('Sovereignty query failed:', error);
        res.status(500).json({ error: 'Failed to retrieve sovereignty scores' });
    }
});

app.get('/api/providers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM providers ORDER BY sovereignty_score DESC');
        res.json({ providers: result.rows });
    } catch (error) {
        logger.error('Providers query failed:', error);
        res.status(500).json({ error: 'Failed to retrieve providers' });
    }
});

app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM house_rooms ORDER BY created_at');
        res.json({
            rooms: result.rows,
            brand: {
                gold: process.env.BRAND_GOLD,
                chocolate: process.env.BRAND_CHOCOLATE,
                sand: process.env.BRAND_SAND,
                rose: process.env.BRAND_ROSE
            }
        });
    } catch (error) {
        logger.error('Rooms query failed:', error);
        res.status(500).json({ error: 'Failed to retrieve rooms' });
    }
});

app.post('/api/chat', enforceSovereignty, async (req, res) => {
    const RequestSchema = z.object({
        message: z.string().min(1).max(10000),
        room: z.string().default('Chat'),
        model: z.enum(['llama3.2', 'mistral', 'codellama:7b']).default('llama3.2'),
        stream: z.boolean().default(false),
        sessionId: z.string().uuid().optional()
    });

    try {
        const { message, room, model, stream, sessionId } = RequestSchema.parse(req.body);
        
        const cacheKey = `chat:${room}:${Buffer.from(message).toString('base64').slice(0, 50)}`;
        const cached = await redis.get(cacheKey);
        
        if (cached && !stream) {
            logger.info('Cache hit');
            return res.json(JSON.parse(cached));
        }

        const estimatedTokens = message.length / 4;
        const estimatedCost = prePriceRequest(estimatedTokens * 2);
        
        if (estimatedCost > parseFloat(process.env.MAX_COST_PER_REQUEST)) {
            return res.status(403).json({
                error: 'Pre-pricing exceeds limit',
                estimated: estimatedCost,
                limit: process.env.MAX_COST_PER_REQUEST,
                sovereignty: 'enforced'
            });
        }

        const response = await ollama.generate({
            model: model,
            prompt: message,
            system: `You are in the ${room} room of the EXPREZZZO Sovereign House. 
                     Maintain sovereignty, enforce brand (Vegas Gold #C5B358, Chocolate #381819).
                     Target: $0.001/request. No vendor lock-in.`,
            stream: stream
        });

        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            for await (const part of response) {
                res.write(`data: ${JSON.stringify(part)}\n\n`);
            }
            res.end();
        } else {
            const tokens = response.eval_count || estimatedTokens;
            const actualCost = prePriceRequest(tokens);
            
            await pool.query(
                'INSERT INTO request_log (room, model_used, tokens_used, estimated_cost) VALUES ($1, $2, $3, $4)',
                [room, model, tokens, actualCost]
            );

            if (sessionId) {
                await pool.query(
                    `INSERT INTO sessions (id, messages, total_tokens, total_cost) 
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (id) DO UPDATE 
                     SET messages = sessions.messages || $2,
                         total_tokens = sessions.total_tokens + $3,
                         total_cost = sessions.total_cost + $4,
                         updated_at = CURRENT_TIMESTAMP`,
                    [sessionId, JSON.stringify([{role: 'user', content: message}, {role: 'assistant', content: response.response}]), tokens, actualCost]
                );
            }

            const result = {
                response: response.response,
                room: room,
                model: model,
                sovereignty: 'preserved',
                cost: actualCost.toFixed(6),
                tokens: tokens
            };

            await redis.setex(cacheKey, 300, JSON.stringify(result));
            res.json(result);
        }
    } catch (error) {
        logger.error('Chat failed:', error);
        res.status(500).json({ 
            error: 'Generation failed', 
            fallback: 'Direct Ollama at localhost:11434',
            sovereignty: 'degraded'
        });
    }
});

app.post('/api/embed', async (req, res) => {
    const EmbedSchema = z.object({
        content: z.string().min(1).max(50000),
        room: z.string().default('Library'),
        metadata: z.object({}).passthrough().optional()
    });

    try {
        const { content, room, metadata } = EmbedSchema.parse(req.body);
        
        const embedding = await ollama.embeddings({
            model: process.env.OLLAMA_PRIMARY_MODEL,
            prompt: content
        });

        const result = await pool.query(
            `INSERT INTO embeddings (content, embedding, room, metadata) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [content, `[${embedding.embedding.join(',')}]`, room, metadata || {}]
        );

        res.json({
            id: result.rows[0].id,
            room: room,
            dimensions: embedding.embedding.length,
            sovereignty: 'preserved'
        });
    } catch (error) {
        logger.error('Embedding failed:', error);
        res.status(500).json({ error: 'Embedding failed' });
    }
});

app.post('/api/search', async (req, res) => {
    const SearchSchema = z.object({
        query: z.string().min(1).max(1000),
        room: z.string().optional(),
        limit: z.number().min(1).max(50).default(10)
    });

    try {
        const { query, room, limit } = SearchSchema.parse(req.body);
        
        const queryEmbedding = await ollama.embeddings({
            model: process.env.OLLAMA_PRIMARY_MODEL,
            prompt: query
        });

        let searchQuery = `
            SELECT id, content, room, metadata,
                   embedding <=> $1::vector as distance
            FROM embeddings
            ${room ? 'WHERE room = $3' : ''}
            ORDER BY embedding <=> $1::vector
            LIMIT $2
        `;

        const params = room 
            ? [`[${queryEmbedding.embedding.join(',')}]`, limit, room]
            : [`[${queryEmbedding.embedding.join(',')}]`, limit];

        const results = await pool.query(searchQuery, params);

        res.json({
            results: results.rows,
            count: results.rows.length,
            sovereignty: 'preserved'
        });
    } catch (error) {
        logger.error('Vector search failed:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 50'
        );
        res.json({ sessions: result.rows });
    } catch (error) {
        logger.error('Sessions query failed:', error);
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});

app.listen(PORT, () => {
    logger.info(`🏠 EXPREZZZO API running on port ${PORT}`);
    logger.info(`🎯 Sovereignty: ${process.env.SOVEREIGNTY_MODE}`);
    logger.info(`💎 Max cost: ${process.env.MAX_COST_PER_REQUEST}/request`);
});