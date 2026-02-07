import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { ChatPage } from '@/components/ChatPage';

const Index = () => {
  const [consented, setConsented] = useState(() => {
    return sessionStorage.getItem('age_consent') === 'true';
  });

  const handleConsent = () => {
    sessionStorage.setItem('age_consent', 'true');
    setConsented(true);
  };

  if (!consented) {
    return <LandingPage onConsent={handleConsent} />;
  }

  return <ChatPage />;
};

export default Index;
