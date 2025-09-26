import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateEvent from './CreateEvent';
import EventDetails from './EventDetails';

type Screen = 'login' | 'dashboard' | 'createEvent' | 'eventDetails';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    if (user) {
      setCurrentScreen('dashboard');
    } else if (!loading) {
      setCurrentScreen('login');
    }
  }, [user, loading]);

  const handleLogin = () => {
    // Auth state change will be handled by useAuth hook
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('login');
  };

  const handleCreateEvent = () => {
    setCurrentScreen('createEvent');
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentScreen('eventDetails');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleEventCreated = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }

    if (!user && currentScreen !== 'login') {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentScreen) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      
      case 'dashboard':
        return (
          <Dashboard
            userEmail={user?.email || ''}
            onCreateEvent={handleCreateEvent}
            onViewEvent={handleViewEvent}
            onLogout={handleLogout}
          />
        );
      
      case 'createEvent':
        return (
          <CreateEvent
            onBack={handleBackToDashboard}
            onCreate={handleEventCreated}
          />
        );
      
      case 'eventDetails':
        return (
          <EventDetails
            eventId={selectedEventId}
            onBack={handleBackToDashboard}
          />
        );
      
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return renderScreen();
};

export default Index;
