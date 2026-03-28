"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "./api-client";

interface Project {
  id: string;
  name: string;
  slug: string;
}

let cachedProject: Project | null = null;

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(cachedProject?.id ?? null);
  const [loading, setLoading] = useState(!cachedProject);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedProject) {
      setProjectId(cachedProject.id);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ projects: Project[] }>("/v1/projects");
        if (cancelled) return;
        const project = data.projects[0];
        if (project) {
          cachedProject = project;
          setProjectId(project.id);
        } else {
          setError("No project found");
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { projectId, loading, error };
}
