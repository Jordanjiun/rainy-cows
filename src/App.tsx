import { SceneProvider } from './context/Providers';
import { AppContent } from './AppContent';

export const App = () => (
  <SceneProvider>
    <AppContent />
  </SceneProvider>
);
