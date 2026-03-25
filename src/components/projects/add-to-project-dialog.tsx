'use client';

import React, { useMemo, useState } from 'react';
import { FolderPlus, Plus, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectsStore } from '@/lib/stores/projects-store';
import { cn } from '@/lib/utils';

interface AddToProjectDialogProps {
  applicationId: number;
  defaultAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export function AddToProjectDialog({
  applicationId,
  defaultAddress,
  latitude,
  longitude,
}: AddToProjectDialogProps) {
  const projects = useProjectsStore((state) => state.projects);
  const createProject = useProjectsStore((state) => state.createProject);
  const addApplicationToProject = useProjectsStore((state) => state.addApplicationToProject);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const projectsWithState = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        hasApplication: project.applicationIds.includes(applicationId),
      })),
    [projects, applicationId],
  );

  const canCreate = newProjectName.trim().length > 1;

  const reset = () => {
    setCreating(false);
    setNewProjectName('');
    setErrorText('');
    setSuccessText('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleAddToExisting = (projectId: string, alreadyAdded: boolean) => {
    setErrorText('');
    if (alreadyAdded) {
      setSuccessText('Already in this project.');
      return;
    }
    addApplicationToProject(projectId, applicationId);
    setSuccessText('Added to project.');
  };

  const handleCreateProject = () => {
    setErrorText('');
    setSuccessText('');
    const name = newProjectName.trim();
    if (name.length < 2) {
      setErrorText('Project name must be at least 2 characters.');
      return;
    }

    const project = createProject({
      name,
      address: defaultAddress || 'Unknown site',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      applicationId,
    });
    setSuccessText(`Created "${project.name}" and added this application.`);
    setCreating(false);
    setNewProjectName('');
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <FolderPlus className="h-3.5 w-3.5" />
        Add to Project
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Application to Project</DialogTitle>
            <DialogDescription>
              Choose an existing project or create a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {projectsWithState.length === 0 ? (
              <div className="rounded-md border border-border bg-background-subtle px-3 py-2 text-sm text-foreground-muted">
                No projects yet. Create your first project below.
              </div>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto">
                {projectsWithState.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
                      project.hasApplication
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-border hover:border-brand-500/40 hover:bg-background-subtle',
                    )}
                    onClick={() => handleAddToExisting(project.id, project.hasApplication)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {project.applicationIds.length} monitored application{project.applicationIds.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {project.hasApplication ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </span>
                    ) : (
                      <span className="text-xs text-brand-500">Add</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-md border border-border p-3">
              {!creating ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-foreground-muted"
                  onClick={() => setCreating(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create new project
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleCreateProject} disabled={!canCreate}>
                      Create & add
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {errorText && (
              <div className="flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errorText}
              </div>
            )}
            {successText && (
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 shrink-0" />
                {successText}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
