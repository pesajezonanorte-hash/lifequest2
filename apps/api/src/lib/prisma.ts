import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || '';
  if (url.includes('db.') && url.includes('.supabase.co')) {
    url = url.replace(/db\.([a-z0-9]+)\.supabase\.co:5432/g, 'aws-0-us-east-1.pooler.supabase.com:5432');
    url = url.replace(/db\.([a-z0-9]+)\.supabase\.co:6543/g, 'aws-0-us-east-1.pooler.supabase.com:6543');
    url = url.replace(/db\.([a-z0-9]+)\.supabase\.co/g, 'aws-0-us-east-1.pooler.supabase.com:5432');
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
