'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';

/** Dropdown to load a saved birth record into a parent form */
export default function BirthSelector({ onSelect, updateSession = true }) {
  const { setBirth: setSessionBirth } = useBirthSession();
  const [births, setBirths] = useState([]);

  useEffect(() => {
    fetch('/api/births')
      .then((r) => r.json())
      .then((d) => setBirths(d.births || []))
      .catch(() => {});
  }, []);

  const handleSelect = async (id) => {
    if (!id || id === '_none') return;
    const res = await fetch(`/api/births/${id}`);
    const birth = await res.json();
    if (updateSession) setSessionBirth(birth);
    onSelect?.(birth);
  };

  if (births.length === 0) return null;

  return (
    <div>
      <Label className="text-slate-400 text-xs">Load saved birth</Label>
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
          <SelectValue placeholder="Choose saved record..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">— Select —</SelectItem>
          {births.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name} ({b.date})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
