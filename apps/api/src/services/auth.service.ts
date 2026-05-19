import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import type { RegisterInput, LoginInput } from '../schemas/auth.schemas';

const BCRYPT_ROUNDS = 12;

function sanitizeUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  intelligence: number;
  charisma: number;
  avatarConfig: unknown;
  timezone: string;
  currency: string;
  language: string;
  relationshipStatus: string;
  onboardingCompleted: boolean;
  birthDate: Date | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    level: user.level,
    xp: user.xp,
    xpToNextLevel: user.xpToNextLevel,
    gold: user.gold,
    hp: user.hp,
    maxHp: user.maxHp,
    mp: user.mp,
    maxMp: user.maxMp,
    strength: user.strength,
    intelligence: user.intelligence,
    charisma: user.charisma,
    avatarConfig: user.avatarConfig,
    timezone: user.timezone,
    currency: user.currency,
    language: user.language,
    relationshipStatus: user.relationshipStatus,
    onboardingCompleted: user.onboardingCompleted,
    birthDate: user.birthDate?.toISOString() ?? null,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] },
  });

  if (existing) {
    if (existing.email === data.email) throw new Error('EMAIL_TAKEN');
    throw new Error('USERNAME_TAKEN');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const bodyType = data.gender ?? 'male';
  const avatarConfig = {
    bodyType,
    hairStyle: bodyType === 'female' ? 'long' : 'short',
    hairColor: '#4a3728',
    skinColor: '#c68642',
    shirtColor: '#4d96ff',
    pants: '#37474f',
    accessory: 'none',
    expression: 'normal',
    pet: null,
  };

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      displayName: data.displayName ?? data.username,
      avatarConfig,
    },
  });

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash, lastLoginAt: new Date() },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash, lastLoginAt: new Date() },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user?.refreshTokenHash) throw new Error('INVALID_REFRESH_TOKEN');

  const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!valid) throw new Error('INVALID_REFRESH_TOKEN');

  const newAccessToken = signAccessToken({ userId: user.id, email: user.email });
  return { accessToken: newAccessToken, user: sanitizeUser(user) };
}

export async function logoutUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}
