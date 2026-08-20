import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3002),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_DEMO_DATA: z.enum(['true', 'false']).default('false'),
});

export type Config = z.infer<typeof envSchema>;
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse({
    ...env,
    DATABASE_URL: env.DATABASE_URL ?? env.PARTICIPANTS_DATABASE_URL,
    PORT: env.PARTICIPANTS_PORT ?? env.PORT,
  });
}
