import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || '';
  if (url.includes('.supabase.co') || url.includes('.pooler.supabase.com')) {
    const refMatch = url.match(/db\.([a-z0-9]+)\.supabase\.co/) || url.match(/postgres\.([a-z0-9]+):/);
    const ref = refMatch ? refMatch[1] : 'dkgjvvypliyfxdmbbnwt';

    url = url.replace(/db\.[a-z0-9]+\.supabase\.co:?\d*/g, 'aws-0-us-east-1.pooler.supabase.com:6543');
    if (ref && !url.includes(`postgres.${ref}`)) {
      url = url.replace(/postgres:/g, `postgres.${ref}:`);
    }
    if (!url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
  }
  return url;
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
