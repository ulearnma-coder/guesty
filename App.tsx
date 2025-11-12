import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ReservationsCalendar from './components/ReservationsCalendar';
import ReservationsList from './components/ReservationsList';
import LayoutManager from './components/LayoutManager';
import Settings from './components/Settings';
import Financials from './components/Financials'; // Import the new component
import { VIEWS } from './constants';
import type { View } from './types';

// Simple SVG icon components to avoid external dependencies
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
);
const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" x2="3.01" y1="6" y2="6"></line><line x1="3" x2="3.01" y1="12" y2="12"></line><line x1="3" x2="3.01" y1="18" y2="18"></line></svg>
);
const LayoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" x2="21" y1="9" y2="9"></line><line x1="9" x2="9" y1="21" y2="9"></line></svg>
);
const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const DollarSignIcon = () => ( // New icon for Financials
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
);

const NAV_ICONS: { [key in View]: React.ReactNode } = {
  [VIEWS.DASHBOARD]: <HomeIcon />,
  [VIEWS.CALENDAR]: <CalendarIcon />,
  [VIEWS.RESERVATIONS]: <ListIcon />,
  [VIEWS.LAYOUT]: <LayoutIcon />,
  [VIEWS.SETTINGS]: <SettingsIcon />,
  [VIEWS.FINANCIALS]: <DollarSignIcon />, // Add icon for the new view
};

/**
 * Main application component.
 * Manages the user session and acts as a gatekeeper, rendering either the
 * login page or the main admin panel.
 */
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<View>(VIEWS.DASHBOARD);

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in authentication state (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);
  
  const handleSignOut = async () => {
      await supabase.auth.signOut();
  };

  const renderView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <Dashboard />;
      case VIEWS.CALENDAR:
        return <ReservationsCalendar />;
      case VIEWS.RESERVATIONS:
        return <ReservationsList />;
      case VIEWS.LAYOUT:
        return <LayoutManager />;
      case VIEWS.SETTINGS:
        return <Settings />;
      case VIEWS.FINANCIALS: // Add case for the new view
        return <Financials />;
      default:
        return <Dashboard />;
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-primary text-text-primary">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-secondary p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-8">ResAdmin</h1>
          <nav className="flex flex-col space-y-2">
            {Object.values(VIEWS).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex items-center space-x-3 p-2 rounded-md text-left transition-colors duration-200 ${
                  activeView === view
                    ? 'bg-highlight text-white'
                    : 'text-text-secondary hover:bg-accent hover:text-white'
                }`}
              >
                {NAV_ICONS[view]}
                <span className="capitalize">{view}</span>
              </button>
            ))}
          </nav>
        </div>
        <div>
           <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 p-2 w-full rounded-md text-left text-text-secondary hover:bg-accent hover:text-white transition-colors duration-200"
            >
              <SignOutIcon />
              <span>Sign Out</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;