'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, User, FolderOpen, Upload } from 'lucide-react';
import { birthRecordToForm } from '@/lib/birth-session';
import { authHeaders } from '@/lib/api-client';

function validateBirthFile(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid chart file');
  if (Number.isNaN(Number(data.year)) || Number.isNaN(Number(data.month)) || Number.isNaN(Number(data.day))) {
    throw new Error('Chart file must include year, month, and day');
  }
  if (Number.isNaN(Number(data.latitude)) || Number.isNaN(Number(data.longitude))) {
    throw new Error('Chart file must include latitude and longitude');
  }
  return birthRecordToForm(data);
}

export default function OpenBirthDialog({ open, onOpenChange, onOpen }) {
  const [births, setBirths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/births', { headers: authHeaders() });
      const data = await res.json();
      setBirths(data.births || []);
    } catch {
      setError('Could not load saved chart files.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  const openRecord = async (id) => {
    setOpeningId(id);
    setError(null);
    try {
      const res = await fetch(`/api/births/${id}`, { headers: authHeaders() });
      const record = await res.json();
      if (record.error) throw new Error(record.error);
      onOpen?.(birthRecordToForm(record));
      onOpenChange?.(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setOpeningId(null);
    }
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      onOpen?.(validateBirthFile(parsed));
      onOpenChange?.(false);
    } catch (err) {
      setError(err.message || 'Could not read chart file');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Open Chart File</DialogTitle>
          <DialogDescription className="text-slate-400">
            Load a saved birth record from <code className="text-xs">data/births/</code> or import a JSON chart file.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto rounded-md border border-slate-800">
          {loading ? (
            <p className="p-4 text-sm text-slate-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading saved files...
            </p>
          ) : births.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No saved chart files yet. Use Save to create one.</p>
          ) : (
            births.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={!!openingId}
                onClick={() => openRecord(b.id)}
                className="w-full text-left px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{b.name}</span>
                  </div>
                  {openingId === b.id && <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate pl-6">
                  {b.date} {b.time} · {b.place || 'No place'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={importFile} />
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 flex-1"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import JSON file
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-slate-400 hover:text-slate-200"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}

export function OpenBirthButton({ onClick, disabled, className }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className={className}
    >
      <FolderOpen className="h-4 w-4 mr-1.5" />
      Open
    </Button>
  );
}
