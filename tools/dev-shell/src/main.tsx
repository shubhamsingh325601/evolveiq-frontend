import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createQueryClient } from '@evolveiq/api-client';
import { AuthProvider } from '@evolveiq/auth';
import { DevShell } from './DevShell';
import './index.css';

const queryClient = createQueryClient();
const container = document.getElementById('root');

if (!container) throw new Error('No #root element to mount into');

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DevShell />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
