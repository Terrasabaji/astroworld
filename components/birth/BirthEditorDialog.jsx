'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BirthForm from '@/components/birth/BirthForm';
import { DEFAULT_BIRTH } from '@/lib/birth-session';

export default function BirthEditorDialog({ open, onOpenChange, initialData, title = 'Birth Details', onSubmit }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_BIRTH, ...initialData }));

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_BIRTH, ...initialData });
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    onSubmit?.(form);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 w-full max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the native&apos;s birth particulars.
          </DialogDescription>
        </DialogHeader>

        <BirthForm
          value={form}
          onChange={setForm}
          showName
          showGender
        />

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            className="text-slate-400 hover:text-slate-200"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-semibold"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
