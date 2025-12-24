/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'almarai': ['Almarai', 'system-ui', 'sans-serif'],
                'inter': ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // Use CSS variables for theming
                primary: 'var(--primary)',
                'on-primary': 'var(--on-primary)',
                'primary-container': 'var(--primary-container)',
                'on-primary-container': 'var(--on-primary-container)',
                secondary: 'var(--secondary)',
                'on-secondary': 'var(--on-secondary)',
                tertiary: 'var(--tertiary)',
                'on-tertiary': 'var(--on-tertiary)',
                error: 'var(--error)',
                'on-error': 'var(--on-error)',
                'error-container': 'var(--error-container)',
                background: 'var(--background)',
                'on-background': 'var(--on-background)',
                surface: 'var(--surface)',
                'on-surface': 'var(--on-surface)',
                'surface-variant': 'var(--surface-variant)',
                'on-surface-variant': 'var(--on-surface-variant)',
                outline: 'var(--outline)',
                'outline-variant': 'var(--outline-variant)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                slideInLeft: {
                    from: { transform: 'translateX(-100%)' },
                    to: { transform: 'translateX(0)' },
                },
                slideInRight: {
                    from: { transform: 'translateX(100%)' },
                    to: { transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
}
