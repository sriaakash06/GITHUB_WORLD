import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '../components/LoginScreen';

/**
 * Root path. Takes a username and sends the visitor to /:username, which is
 * the link they can share with anyone.
 */
export function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'GitVille — Your GitHub World in 3D';
  }, []);

  return <LoginScreen onSubmit={(username) => navigate(`/${username}`)} />;
}
