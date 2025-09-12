import { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateEvent from './CreateEvent';
import EventDetails from './EventDetails';

type Screen = 'login' | 'dashboard' | 'createEvent' | 'eventDetails';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const handleLogin = (email: string) => {
    setCurrentUser(email);
    setCurrentScreen('dashboard');
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
    switch (currentScreen) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      
      case 'dashboard':
        return (
          <Dashboard
            userEmail={currentUser}
            onCreateEvent={handleCreateEvent}
            onViewEvent={handleViewEvent}
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
