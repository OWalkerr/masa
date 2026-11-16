import { matchRoute, usePath } from './router';
import { DevTable } from './screens/DevTable';
import { Home } from './screens/Home';
import { NotFound } from './screens/NotFound';
import { RoomScreen } from './screens/RoomScreen';
import { TvScreen } from './screens/TvScreen';
import { Toasts } from './components/Toasts';

export function App() {
  const route = matchRoute(usePath());
  return (
    <>
      {route.name === 'home' && <Home />}
      {route.name === 'room' && <RoomScreen code={route.code} />}
      {route.name === 'tv' && <TvScreen code={route.code} />}
      {route.name === 'devTable' && <DevTable />}
      {route.name === 'notFound' && <NotFound />}
      <Toasts />
    </>
  );
}
