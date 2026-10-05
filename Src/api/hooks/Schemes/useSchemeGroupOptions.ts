// Src/api/hooks/Schemes/useSchemeGroupOptions.ts
//
// Ported from Src/Hooks/useSchemeAmount.js. See the note in
// useSchemeCatalog.ts — this hook used to share the exported name
// `useSchemes` with a completely different hook in useScheme.js, which has
// been fixed here by giving each a distinct, descriptive name.
import { useState, useEffect } from 'react';
import { schemeService } from '../../services/schemeService';
import { SchemeGroupOption } from '../../../types/Scheme/Scheme';

export const useSchemeGroupOptions = (schemeId?: number | string) => {
  const [schemes, setSchemes] = useState<SchemeGroupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeId) return;

    const fetchSchemes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await schemeService.getGroupOptions(schemeId);
        setSchemes(data);
      } catch (err: any) {
        setError(err?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [schemeId]);

  const getAmount = (groupCode: string): number | null => {
    const scheme = schemes.find((s) => s.GROUPCODE === groupCode);
    return scheme ? scheme.AMOUNT : null;
  };

  const getRegNo = (groupCode: string): number => {
    const scheme = schemes.find((s) => s.GROUPCODE === groupCode);
    // A new group can return CURRENTREGNO: 0. Razorpay requires a truthy
    // registration number, so the first registration starts at 1.
    return scheme?.CURRENTREGNO || 1;
  };

  return { schemes, loading, error, getAmount, getRegNo };
};
