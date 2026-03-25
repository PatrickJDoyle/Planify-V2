'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus, Trash2, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { useProjectsStore } from '@/lib/stores/projects-store';

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useProjectsStore((state) => state.projects);
  const createProject = useProjectsStore((state) => state.createProject);
  const deleteProject = useProjectsStore((state) => state.deleteProject);

  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');

  const canCreate = projectName.trim().length > 1 && projectAddress.trim().length > 3;
  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [projects],
  );

  const handleCreateProject = () => {
    if (!canCreate) return;
    const created = createProject({
      name: projectName.trim(),
      address: projectAddress.trim(),
    });
    setProjectName('');
    setProjectAddress('');
    setIsCreating(false);
    router.push(`/projects/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects Workspace</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Organise site intelligence, monitored applications, alerts, and notes by project.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-brand-500 hover:bg-brand-600"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-foreground">Create Project</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Project name (e.g. Clontarf Extension Feasibility)"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <Input
              placeholder="Site address"
              value={projectAddress}
              onChange={(event) => setProjectAddress(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreateProject} disabled={!canCreate}>
                Create Project
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setProjectName('');
                  setProjectAddress('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedProjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organising site intelligence and monitored applications."
        >
          <Button
            size="sm"
            className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first project
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedProjects.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{project.address}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-foreground-muted hover:text-destructive"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span>{project.applicationIds.length} monitored app{project.applicationIds.length === 1 ? '' : 's'}</span>
                  {project.latitude !== null && project.longitude !== null && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location set
                    </span>
                  )}
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString('en-IE')}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  Open Workspace
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
