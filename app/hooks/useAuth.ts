import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(
      auth, 
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        setError(null);
        
        // Only redirect if explicitly requested and no user
        if (!currentUser && redirectToLogin) {
          router.push('/login');
        }
      },
      (authError) => {
        console.error('Auth state change error:', authError);
        setError(authError.message);
        setUser(null);
        setLoading(false);
        
        // Redirect on error if auth is required
        if (requireAuth) {
          router.push('/login');
        }
      }
    );
    
    return () => unsubscribe();
  }, [router, redirectToLogin, requireAuth]);

  return { user, loading, error };
};

// Convenience hooks for specific use cases
export const useAuthRequired = () => {
  return useAuth({ requireAuth: true, redirectToLogin: true });
};

export const useAuthOptional = () => {
  return useAuth({ requireAuth: false, redirectToLogin: false });
};