// Koltuk kimliği localStorage'da tutulur. /dev/table'daki her iframe ?seat=N ile ayrı ad alanı kullanır.
export interface Seat {
  playerId: string;
  secret: string;
}

export interface Profile {
  name: string;
  avatar: number;
}

function ns(): string {
  const seat = new URLSearchParams(location.search).get('seat');
  return seat ? `masa:s${seat.replace(/[^0-9a-z]/gi, '').slice(0, 4)}:` : 'masa:';
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(ns() + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(ns() + key);
    else localStorage.setItem(ns() + key, JSON.stringify(value));
  } catch {
    /* gizli sekme vb. — kimlik yalnızca bu oturumda yaşar */
  }
}

export const loadSeat = (code: string) => read<Seat>(`seat:${code}`);
export const saveSeat = (code: string, seat: Seat | null) => write(`seat:${code}`, seat);
export const loadProfile = () => read<Profile>('profile');
export const saveProfile = (p: Profile) => write('profile', p);
export const loadPref = <T,>(k: string) => read<T>(`pref:${k}`);
export const savePref = (k: string, v: unknown) => write(`pref:${k}`, v);
