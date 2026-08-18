import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  EVENTS_SERVICE_URL: z.url().default('http://localhost:3001'),
  PARTICIPANTS_SERVICE_URL: z.url().default('http://localhost:3002'),
  PORT: z.coerce.number().int().positive().default(3003),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Config = z.infer<typeof envSchema>;
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse({
    ...env,
    DATABASE_URL: env.DATABASE_URL ?? env.REGISTRATIONS_DATABASE_URL,
    PORT: env.REGISTRATIONS_PORT ?? env.PORT,
  });
}
