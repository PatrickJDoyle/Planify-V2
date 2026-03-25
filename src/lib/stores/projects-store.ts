import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CreateProjectInput, Project } from '@/lib/types/project';

interface ProjectsStore {
  projects: Project[];
  createProject: (input: CreateProjectInput) => Project;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  updateNotes: (projectId: string, notes: string) => void;
  addApplicationToProject: (projectId: string, applicationId: number) => void;
  removeApplicationFromProject: (projectId: string, applicationId: number) => void;
}

function createProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sortByRecent(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set) => ({
      projects: [],

      createProject: (input) => {
        const project: Project = {
          id: createProjectId(),
          name: input.name.trim(),
          address: input.address.trim(),
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          applicationIds: input.applicationId ? [input.applicationId] : [],
          notes: '',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        set((state) => ({
          projects: sortByRecent([project, ...state.projects]),
        }));

        return project;
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
        }));
      },

      renameProject: (projectId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        set((state) => ({
          projects: sortByRecent(
            state.projects.map((project) =>
              project.id === projectId
                ? { ...project, name: trimmed, updatedAt: nowIso() }
                : project,
            ),
          ),
        }));
      },

      updateNotes: (projectId, notes) => {
        set((state) => ({
          projects: sortByRecent(
            state.projects.map((project) =>
              project.id === projectId
                ? { ...project, notes, updatedAt: nowIso() }
                : project,
            ),
          ),
        }));
      },

      addApplicationToProject: (projectId, applicationId) => {
        set((state) => ({
          projects: sortByRecent(
            state.projects.map((project) => {
              if (project.id !== projectId) return project;
              if (project.applicationIds.includes(applicationId)) return project;
              return {
                ...project,
                applicationIds: [...project.applicationIds, applicationId],
                updatedAt: nowIso(),
              };
            }),
          ),
        }));
      },

      removeApplicationFromProject: (projectId, applicationId) => {
        set((state) => ({
          projects: sortByRecent(
            state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    applicationIds: project.applicationIds.filter((id) => id !== applicationId),
                    updatedAt: nowIso(),
                  }
                : project,
            ),
          ),
        }));
      },
    }),
    {
      name: 'planify-v2-projects',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
