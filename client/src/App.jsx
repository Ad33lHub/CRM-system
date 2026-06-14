import React from 'react';
import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import PageLoader from './components/common/PageLoader.jsx';
import router from './routes/index.jsx';
import useAuthInit from './hooks/useAuthInit.js';

export default function App() {
  const { isInitialised } = useAuthInit();

  if (!isInitialised) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

