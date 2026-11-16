// Küçük yol yönlendirici (bağımlılık yok)
import { useEffect, useState } from 'react';

export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath(): string {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return path;
}

export type Route =
  | { name: 'home' }
  | { name: 'room'; code: string }
  | { name: 'tv'; code: string }
  | { name: 'devTable' }
  | { name: 'notFound' };

export function matchRoute(path: string): Route {
  if (path === '/' || path === '') return { name: 'home' };
  let m = path.match(/^\/m\/([A-Za-z]{4})\/?$/);
  if (m) return { name: 'room', code: m[1]!.toUpperCase() };
  m = path.match(/^\/tv\/([A-Za-z]{4})\/?$/);
  if (m) return { name: 'tv', code: m[1]!.toUpperCase() };
  if (path.replace(/\/$/, '') === '/dev/table') return { name: 'devTable' };
  return { name: 'notFound' };
}
