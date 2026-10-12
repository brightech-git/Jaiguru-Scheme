// Src/api/hooks/Schemes/useSchemeCatalog.ts
import { useState, useEffect } from 'react';
import { schemeService } from '../../services/schemeService';
import { Scheme } from '../../../types/Scheme/Scheme';

export const useSchemeCatalog = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSchemes = async () => {
      try {
        setLoading(true);
        const data: any[] = await schemeService.getAll() || [];
        // Render cards immediately; ApiImage loads and caches each image independently.
        setSchemes(data);
      } catch (err: any) {
        setError(err?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    getSchemes();
  }, []);

  return { schemes, loading, error };
};
