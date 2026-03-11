import { useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AppRoutes from './routes/AppRoutes';
import { testConnection } from './supabaseClient';
import './App.css';

function App() {
  // Test Supabase connection on app load
  useEffect(() => {
    console.log('🚀 Unimate App Loaded - Phase 0');
    testConnection();
  }, []);

  return (
    <div className="App">
      <AppRoutes />
      <SpeedInsights />
    </div>
  );
}

export default App;
