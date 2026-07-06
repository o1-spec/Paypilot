import { useState, useEffect } from 'react';

export function useSession() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('paypilot_demo_session');
    if (data) {
      try {
        setSession(JSON.parse(data));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  return { session, loading };
}
