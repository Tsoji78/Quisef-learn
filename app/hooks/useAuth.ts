// hooks/useAuth.tsx (updated)
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth'; // Add setPersistence import
import { useRouter } from 'next/navigation';

interface UseAuthOptions {
  redirectToLogin?: boolean;
  requireAuth?: boolean;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { redirectToLogin = false, requireAuth = false } = options;

  useEffect(() => {
    const auth = getAuth();
    
    // Explicitly set persistence to local (ensures cross-tab/session survival)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Auth persistence set to local'); // Debug: Confirm setup
      })
      .catch((err) => {
        console.error('Failed to set auth persistence:', err); // Debug: Catch failures
      });

    const unsubscribe = onAuthStateChanged(
      auth, 
      (currentUser) => {
        console.log('onAuthStateChanged fired:', currentUser ? currentUser.uid : 'null'); // Debug: Track state changes
        setUser(currentUser);
        setLoading(false);
        setError(null);
        
        if (!currentUser && redirectToLogin) {
          router.push('/login');
        }
      },
      (authError) => {
        console.error('Auth state change error:', authError); // Already there—good!
        setError(authError.message);
        setUser(null);
        setLoading(false);
        
        if (requireAuth) {
          router.push('/login');
        }
      }
    );
    
    return () => unsubscribe();
  }, [router, redirectToLogin, requireAuth]);

  return { user, loading, error };
};

// Convenience hooks unchanged...
export const useAuthRequired = () => {
  return useAuth({ requireAuth: true, redirectToLogin: true });
};

export const useAuthOptional = () => {
  return useAuth({ requireAuth: false, redirectToLogin: false });
};