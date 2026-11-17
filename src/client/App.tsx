import { lazy, Suspense } from 'react';
import { matchRoute, usePath } from './router';

// Ana Ekran ve geliştirici masası ayrı paket: telefonlar indirmez
const TvScreen = lazy(() => import('./screens/TvScreen').then((m) => ({ default: m.TvScreen })));
const DevTable = lazy(() => import('./screens/DevTable').then((m) => ({ default: m.DevTable })));
import { Home } from './screens/Home';
import { NotFound } from './screens/NotFound';
import { RoomScreen } from './screens/RoomScreen';
import { Toasts } from './components/Toasts';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ParticleLayer } from './fx/ParticleLayer';
import { Ambient } from './fx/Ambient';

export function App() {
  const route = matchRoute(usePath());
  return (
    <ErrorBoundary>
      {route.name === 'home' && <Home />}
      {route.name === 'room' && <RoomScreen code={route.code} />}
      <Suspense fallback={null}>
        {route.name === 'tv' && <TvScreen code={route.code} />}
        {route.name === 'devTable' && <DevTable />}
      </Suspense>
      {route.name === 'notFound' && <NotFound />}
      <ParticleLayer />
      {route.name !== 'devTable' && <Ambient spiders={route.name !== 'home'} />}
      <Toasts />
    </ErrorBoundary>
  );
}
