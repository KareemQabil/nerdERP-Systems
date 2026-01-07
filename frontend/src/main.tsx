import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ConfigLoader } from '@/components/core/ConfigLoader'

// Get store ID from URL or localStorage
const getStoreId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('store') || localStorage.getItem('nerdpos-store-id') || 'default-store-id';
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigLoader storeId={getStoreId()}>
      <App />
    </ConfigLoader>
  </StrictMode>,
)
