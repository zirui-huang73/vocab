import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import Home from './pages/Home';
import TopicPage from './pages/TopicPage';
import Study from './pages/Study';
import Settings from './pages/Settings';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="/study/:mode/:scope" element={<Study />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
