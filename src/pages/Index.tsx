import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import LandingPage from './LandingPage';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateEvent from './CreateEvent';
import EventDetails from './EventDetails';
import ChatWidget from '@/components/ChatWidget';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { motion } from 'framer-motion';

import { useSearchParams } from 'react-router-dom';
import { templates, EventTemplate } from '@/data/templates';

type Screen = 'landing' | 'login' | 'dashboard' | 'createEvent' | 'eventDetails';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const [initialTemplate, setInitialTemplate] = useState<EventTemplate | null>(null);

  useEffect(() => {
    const templateSlug = searchParams.get('template');
    if (templateSlug) {
      const template = templates.find(t => t.slug === templateSlug);
      if (template) {
        setInitialTemplate(template);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      // If there is a template and we just logged in (or loaded), go to create event
      if (initialTemplate) {
        setCurrentScreen('createEvent');
      } else {
        setCurrentScreen('dashboard');
      }
    } else if (!loading) {
      setCurrentScreen('landing');
    }
  }, [user, loading, initialTemplate]);

  const handleLogin = () => {
    // If we have a template, go to create event after login
    if (initialTemplate) {
      setCurrentScreen('createEvent');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('login');
  };

  const handleCreateEvent = () => {
    setInitialTemplate(null); // Clear template if creating manually from dashboard
    setCurrentScreen('createEvent');
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentScreen('eventDetails');
  };

  const handleBackToDashboard = () => {
    setInitialTemplate(null);
    setCurrentScreen('dashboard');
  };

  const handleEventCreated = () => {
    setInitialTemplate(null);
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
          {/* Animated Background Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          />

          <div className="text-center relative z-10">
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
      case 'landing':
        return <LandingPage />;

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
            initialData={initialTemplate}
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

  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {renderScreen()}
      <ChatWidget />
    </>
  );
};

export default Index;
