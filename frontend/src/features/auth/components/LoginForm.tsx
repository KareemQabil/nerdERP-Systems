import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loginSchema } from '../schemas/auth.schemas';
import type { LoginFormData } from '../schemas/auth.schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

interface LoginFormProps {
    onSubmit: (data: LoginFormData) => Promise<void>;
    isLoading: boolean;
    error?: string | null;
}

/**
 * Login form component with validation
 */
export const LoginForm = ({ onSubmit, isLoading, error }: LoginFormProps) => {
    const { t } = useTranslation('auth');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
            rememberMe: false,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Global Error */}
            {error && (
                <div className="p-3 rounded-lg bg-[var(--error-container)] border border-[var(--error)]">
                    <p className="text-sm text-[var(--on-error-container)]">{error}</p>
                </div>
            )}

            {/* Username Field */}
            <Input
                {...register('username')}
                label={t('username')}
                placeholder={t('usernamePlaceholder')}
                helperText={t('usernameHelper')}
                error={errors.username?.message ? t(errors.username.message) : undefined}
                disabled={isLoading}
                autoComplete="username"
            />

            {/* Password Field */}
            <div className="relative">
                <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label={t('password')}
                    placeholder={t('passwordPlaceholder')}
                    error={errors.password?.message ? t(errors.password.message) : undefined}
                    disabled={isLoading}
                    autoComplete="current-password"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-[2.15rem] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors"
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
                <Checkbox
                    {...register('rememberMe')}
                    label={t('rememberMe')}
                    disabled={isLoading}
                />
                <a
                    href="#"
                    className="text-sm text-[var(--primary)] hover:text-[var(--tertiary)] transition-colors"
                >
                    {t('forgotPassword')}
                </a>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full group mt-8"
                isLoading={isLoading}
            >
                {isLoading ? t('loggingIn') : t('login')}
                {!isLoading && (
                    <ArrowRight
                        size={18}
                        className="ms-2 group-hover:translate-x-1 transition-transform"
                    />
                )}
            </Button>
        </form>
    );
};
