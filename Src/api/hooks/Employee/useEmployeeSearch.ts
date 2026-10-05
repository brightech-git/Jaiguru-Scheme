// Src/api/hooks/Employee/useEmployeeSearch.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { employeeService } from '../../services/employeeService';
import { Employee } from '../../../types/Employee/Employee';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Loads the active employee list once `enabled` turns true, then filters it
 * locally by name or id. A numeric query with no local match is looked up on
 * the server, in case the employee is missing from the full list.
 */
export const useEmployeeSearch = (enabled: boolean) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [remoteMatches, setRemoteMatches] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.search('');
      setEmployees(Array.isArray(data) ? data : []);
      loadedRef.current = true;
    } catch (err: any) {
      setError(err?.message || 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !loadedRef.current) load();
  }, [enabled, load]);

  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const active = employees.filter((e) => e.ACTIVE === 'Y');
    if (!trimmed) return active;
    const q = trimmed.toLowerCase();
    return active.filter((e) => String(e.EMPID).includes(q) || (e.EMPNAME || '').toLowerCase().includes(q));
  }, [employees, trimmed]);

  useEffect(() => {
    setRemoteMatches([]);
    if (!enabled || !/^\d+$/.test(trimmed) || filtered.length > 0) return;

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await employeeService.search(trimmed);
        if (active) setRemoteMatches((Array.isArray(data) ? data : []).filter((e) => e.ACTIVE === 'Y'));
      } catch {
        // A failed lookup just leaves the empty state on screen.
      } finally {
        if (active) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, trimmed, filtered.length]);

  return {
    results: filtered.length > 0 ? filtered : remoteMatches,
    query,
    setQuery,
    loading,
    error,
    retry: load,
  };
};
