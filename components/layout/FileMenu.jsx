'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FolderOpen, FilePlus, Save, Edit, SaveAll, LogOut, ChevronDown } from 'lucide-react';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import { DEFAULT_BIRTH } from '@/lib/birth-session';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BirthEditorDialog from '@/components/birth/BirthEditorDialog';
import OpenBirthDialog from '@/components/birth/OpenBirthDialog';
import { birthFormToPayload } from '@/components/birth/BirthForm';
import { birthRecordToForm } from '@/lib/birth-session';
import { authHeaders } from '@/lib/api-client';

export default function FileMenu() {
  const { birth, setBirth } = useBirthSession();
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNew = () => setNewOpen(true);

  const handleNewSubmit = (data) => {
    setBirth(data);
  };

  const handleOpen = () => setOpenDialog(true);

  const handleOpenRecord = (loaded) => {
    setBirth(loaded);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...birthFormToPayload(birth),
        id: birth.record_id,
        name: birth.name?.trim() || 'Native',
      };
      const res = await fetch('/api/births', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (saved.error) throw new Error(saved.error);
      setBirth({ ...birth, record_id: saved.id, name: saved.name });
    } catch (e) {
      console.error('Save failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => setEditOpen(true);

  const handleEditSubmit = (data) => {
    setBirth(data);
  };

  const handleSaveAs = async () => {
    const newName = prompt('Save as (enter name):', (birth.name || 'Native') + ' copy');
    if (!newName) return;
    setSaving(true);
    try {
      const payload = {
        ...birthFormToPayload(birth),
        name: newName.trim(),
      };
      const res = await fetch('/api/births', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (saved.error) throw new Error(saved.error);
      setBirth({ ...birth, record_id: saved.id, name: saved.name });
    } catch (e) {
      console.error('Save As failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    setBirth(DEFAULT_BIRTH);
    router.push('/');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 min-h-[44px] py-1.5 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors">
          File
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-slate-900 border-slate-700 text-slate-100 min-w-[160px]">
          <DropdownMenuItem onClick={handleNew} className="cursor-pointer min-h-[44px]">
            <FilePlus className="h-4 w-4 mr-2" />
            New
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpen} className="cursor-pointer min-h-[44px]">
            <FolderOpen className="h-4 w-4 mr-2" />
            Open
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem onClick={handleSave} disabled={saving} className="cursor-pointer min-h-[44px]">
            <Save className="h-4 w-4 mr-2" />
            Save
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer min-h-[44px]">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveAs} disabled={saving} className="cursor-pointer min-h-[44px]">
            <SaveAll className="h-4 w-4 mr-2" />
            Save As
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem onClick={handleExit} className="cursor-pointer text-red-400 min-h-[44px]">
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BirthEditorDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        initialData={DEFAULT_BIRTH}
        title="New Birth"
        onSubmit={handleNewSubmit}
      />
      <BirthEditorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={birth}
        title="Edit Birth"
        onSubmit={handleEditSubmit}
      />
      <OpenBirthDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onOpen={handleOpenRecord}
      />
    </>
  );
}
