import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm';
import { Card } from '@/components/ui/Card';
import type { LoginFormData } from '../schemas/auth.schemas';

/**
 * Login page component
 * Matches the NerdPOS design with RTL support
 */
export const LoginPage = () => {
    const { t, i18n } = useTranslation('auth');
    const { signIn, user, loading, error } = useAuth();
    const navigate = useNavigate();

    // Set document direction based on language
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    // Redirect if already authenticated
    useEffect(() => {
        if (user && !loading) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleLogin = async (data: LoginFormData) => {
        try {
            await signIn({
                username: data.username,
                password: data.password,
            });
            // Navigation will happen automatically via the useEffect above
        } catch (err) {
            // Error is handled by the auth context
            console.error('Login failed:', err);
        }
    };

    // Map error message keys to translation keys
    const getErrorMessage = (errorMsg: string | null): string | null => {
        if (!errorMsg) return null;

        const errorKeyMap: Record<string, string> = {
            'Invalid credentials': 'errors.invalidCredentials',
            'User is inactive': 'errors.userInactive',
            'User not found': 'errors.userNotFound',
        };

        const translationKey = errorKeyMap[errorMsg];
        return translationKey ? t(translationKey) : errorMsg;
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]"
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--primary)]/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--tertiary)]/10 rounded-full blur-3xl" />
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md p-10 relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
                        {t('appName')}
                    </h1>
                    <p className="text-sm text-[var(--on-surface-variant)]">
                        {t('appTagline')}
                    </p>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-[var(--on-surface)] mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-sm text-[var(--on-surface-variant)]">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Login Form */}
                <LoginForm
                    onSubmit={handleLogin}
                    isLoading={loading}
                    error={getErrorMessage(error)}
                />

                {/* Footer */}
                <div className="mt-10 text-center">
                    <p className="text-xs text-[var(--on-surface-variant)]">
                        {t('footer.copyright')}
                    </p>
                </div>
            </Card>
        </div>
    );
};
