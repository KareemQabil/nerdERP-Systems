@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Fonts */
@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  :root {
    /* Light Theme Colors */
    --primary: #00ACC1;
    --on-primary: #FFFFFF;
    --primary-container: #E0F7FA;
    --on-primary-container: #0D3B52;
    
    --secondary: #0D3B52;
    --on-secondary: #FFFFFF;
    --secondary-container: #E3F2FD;
    --on-secondary-container: #0D3B52;
    
    --tertiary: #00897B;
    --on-tertiary: #FFFFFF;
    --tertiary-container: #E0F2F1;
    --on-tertiary-container: #004D40;
    
    --error: #D32F2F;
    --on-error: #FFFFFF;
    --error-container: #FFEBEE;
    --on-error-container: #B71C1C;
    
    --background: #F8FAFB;
    --on-background: #0D3B52;
    --surface: #FFFFFF;
    --on-surface: #0D3B52;
    --surface-variant: #F0F4F8;
    --on-surface-variant: #546E7A;
    
    --outline: #B0BEC5;
    --outline-variant: #E1E8ED;
  }

  [data-theme="dark"] {
    /* Dark Theme Colors */
    --primary: #22D3EE;
    --on-primary: #00373A;
    --primary-container: #005053;
    --on-primary-container: #99F0FF;
    
    --secondary: #B9C8DA;
    --on-secondary: #243240;
    --secondary-container: #3A4857;
    --on-secondary-container: #D5E4F7;
    
    --tertiary: #006399;
    --on-tertiary: #FFFFFF;
    --tertiary-container: #004A75;
    --on-tertiary-container: #CDE5FF;
    
    --error: #FFB4AB;
    --on-error: #690005;
    --error-container: #93000A;
    --on-error-container: #FFDAD6;
    
    --background: #023047;
    --on-background: #E2E2E6;
    --surface: #1A1C1E;
    --on-surface: #E2E2E6;
    --surface-variant: #42474E;
    --on-surface-variant: #C2C7CE;
    
    --outline: #72787E;
    --outline-variant: #42474E;
  }

  [data-theme="luxury"] {
    /* Luxury Theme Colors */
    --primary: #FFD700;
    --on-primary: #1A1A1A;
    --primary-container: #2A2A2A;
    --on-primary-container: #FFD700;
    
    --secondary: #C9B037;
    --on-secondary: #000000;
    --secondary-container: #1F1F1F;
    --on-secondary-container: #F4E4BC;
    
    --tertiary: #DAA520;
    --on-tertiary: #000000;
    --tertiary-container: #2D2D2D;
    --on-tertiary-container: #FFE55C;
    
    --error: #FF6B6B;
    --on-error: #000000;
    --error-container: #3D1A1A;
    --on-error-container: #FFB3B3;
    
    --background: #000000;
    --on-background: #FFFFFF;
    --surface: #0A0A0A;
    --on-surface: #FFFFFF;
    --surface-variant: #1A1A1A;
    --on-surface-variant: #D4AF37;
    
    --outline: #4A4A4A;
    --outline-variant: #2A2A2A;
  }

  * {
    border-color: var(--outline);
  }

  body {
    background-color: var(--background);
    color: var(--on-background);
    font-family: 'Almarai', 'Segoe UI', system-ui, sans-serif;
  }

  html {
    direction: rtl;
  }

  /* Typography Defaults - Arabic */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Almarai', 'Segoe UI', system-ui, sans-serif;
    font-weight: 700;
  }

  p, span, div {
    font-family: 'Almarai', 'Segoe UI', system-ui, sans-serif;
  }

  /* Numbers and Prices use Inter font */
  .font-inter {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  /* RTL Number Handling */
  .rtl-number {
    direction: ltr;
    text-align: left;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(34, 211, 238, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 211, 238, 0.5);
  }

  /* Smooth Transitions */
  * {
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@layer components {
  /* Button variants */
  .btn-primary {
    background-color: var(--primary);
    color: var(--on-primary);
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    transition: all 150ms;
  }
  
  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    background-color: transparent;
    border: 2px solid var(--outline);
    color: var(--primary);
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    transition: all 150ms;
  }
  
  .btn-secondary:hover {
    background-color: color-mix(in srgb, var(--primary) 10%, transparent);
  }

  /* Card styles */
  .card {
    background-color: var(--surface);
    border: 1px solid var(--outline-variant);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0px 2px 8px rgba(13, 59, 82, 0.08);
  }

  [data-theme="dark"] .card {
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
  }

  [data-theme="luxury"] .card {
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.3);
    border-color: #4A4A4A;
  }
}

@layer utilities {
  /* Text direction utilities */
  .text-rtl {
    direction: rtl;
    text-align: right;
  }

  .text-ltr {
    direction: ltr;
    text-align: left;
  }

  /* Animation utilities */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
}
