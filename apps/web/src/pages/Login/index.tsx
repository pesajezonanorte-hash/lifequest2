import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import * as authService from '../../services/auth.service';
import { PixelButton } from '../../components/ui/PixelButton';
import { PixelInput } from '../../components/ui/PixelInput';
import { MiguelSprite } from '../../components/character/MiguelSprite';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');
  const [spriteAnim, setSpriteAnim] = useState<'idle' | 'celebrate' | 'hurt'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError('');
    try {
      const { user, accessToken } = await authService.login(data);
      setAuth(user, accessToken);
      setSpriteAnim('celebrate');
      setTimeout(() => navigate('/'), 500);
    } catch (err: unknown) {
      setSpriteAnim('hurt');
      setTimeout(() => setSpriteAnim('idle'), 600);
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setApiError(message ?? 'We could not sign you in. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-panel)] p-10 shadow-lg lg:block"
        >
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-panel-light)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
                Sistema LifeQuest en línea
              </div>
              <div className="space-y-4">
                <h1 className="max-w-xl text-5xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                  Construye tu vida real como un RPG.
                </h1>
                <p className="max-w-lg text-base text-[var(--text-secondary)]">
                  Misiones, hábitos, gym, finanzas y perfil en un área moderna y relajante.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Inicio', 'Visión limpia y lineal de todo tu día'],
                ['Registro de Misiones', 'Sigue tu progreso, XP y oro ganado'],
                ['El Sabio', 'Guía con IA basada en tus datos reales'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel-light)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--bg-panel)] p-8 shadow-lg"
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <img src="/brand/lifequest-logo.png" alt="LifeQuest" className="h-11 w-11 rounded-2xl border border-[var(--border)] bg-white object-cover" />
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">Bienvenido de nuevo</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Inicia sesión en tu partida.</p>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--bg-panel-light)]">
              <MiguelSprite size={64} animate={spriteAnim} />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PixelInput
              label="Email"
              type="email"
              placeholder="miguel@lifequest.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <div>
              <PixelInput
                label="Contraseña"
                type={showPass ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
              </button>
            </div>

            {apiError && (
              <motion.div
                className="rounded-2xl border border-[var(--accent-red)] bg-red-50 px-3 py-2 text-sm text-[var(--accent-red)] dark:bg-red-950/20"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {apiError}
              </motion.div>
            )}

            <PixelButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              size="lg"
              className="mt-2"
            >
              {isSubmitting ? 'Cargando...' : 'Entrar al mundo'}
            </PixelButton>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            ¿Buscas aventuras?{' '}
            <Link to="/register" className="font-semibold text-[var(--accent-blue)] hover:underline">
              Crea tu héroe
            </Link>
          </p>
        </motion.section>
      </div>
    </div>
  );
}
