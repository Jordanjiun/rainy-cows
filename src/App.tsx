import { SceneProvider } from './context/SceneProvider';
import { AppContent } from './AppContent';

export const App = () => (
  <SceneProvider>
    <AppContent />
  </SceneProvider>
);
