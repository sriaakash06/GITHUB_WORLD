import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Landing } from './pages/Landing';
import { World } from './pages/World';

/**
 * Routes:
 *   /            → landing page with the username input
 *   /:username   → that account's live 3D world (the shareable link)
 *
 * NOTE: /:username is a client-side route, so a direct visit or refresh needs
 * the host to serve index.html for unknown paths. See vercel.json.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/:username" element={<World />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
