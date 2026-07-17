import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  projectService = inject(ProjectService);
  teamService = inject(TeamService);
  authService = inject(AuthService);
  searchService = inject(SearchService);

  showModal = false;
  showEditModal = false;
  expandedProjectId: string | null = null;
  selectedTab: 'active' | 'archived' = 'active';

  clients: any[] = [];
  devs: any[] = [];

  newProject = {
    name: '',
    budget: 0,
    clients: [] as string[], // Assigned client UUIDs
    devs: [] as string[],    // Assigned developer UUIDs
    description: 'New Project'
  };

  editingProjectModel = {
    id: '',
    name: '',
    budget: 0,
    clients: [] as string[], // Assigned client UUIDs
    devs: [] as string[],    // Assigned developer UUIDs
    description: ''
  };

  // REACTIVE DYNAMIC SEARCH FILTER
  filteredProjects = computed(() => {
    const q = this.searchService.query().toLowerCase().trim();
    const projs = this.projectService.projects();
    if (!q) return projs;

    return projs.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadProjects();

    // Only fetch team if Admin
    if (this.authService.isAdmin()) {
        this.teamService.getTeam().subscribe(res => {
            if (res.data) {
                this.clients = res.data.filter((u: any) => u.role === 'client');
                this.devs = res.data.filter((u: any) => u.role === 'dev');
            }
        });
    }
  }

  loadProjects() {
    const filterStatus = this.selectedTab === 'archived' ? 'archived' : undefined;
    this.projectService.getProjects(filterStatus).subscribe();
  }

  switchTab(tab: 'active' | 'archived') {
    this.selectedTab = tab;
    this.expandedProjectId = null;
    this.loadProjects();
  }

  // --- Click-to-Toggle selection helpers ---
  toggleClientSelection(clientId: string) {
    const idx = this.newProject.clients.indexOf(clientId);
    if (idx > -1) {
      this.newProject.clients.splice(idx, 1);
    } else {
      this.newProject.clients.push(clientId);
    }
  }

  toggleDevSelection(devId: string) {
    const idx = this.newProject.devs.indexOf(devId);
    if (idx > -1) {
      this.newProject.devs.splice(idx, 1);
    } else {
      this.newProject.devs.push(devId);
    }
  }

  toggleEditClientSelection(clientId: string) {
    const idx = this.editingProjectModel.clients.indexOf(clientId);
    if (idx > -1) {
      this.editingProjectModel.clients.splice(idx, 1);
    } else {
      this.editingProjectModel.clients.push(clientId);
    }
  }

  toggleEditDevSelection(devId: string) {
    const idx = this.editingProjectModel.devs.indexOf(devId);
    if (idx > -1) {
      this.editingProjectModel.devs.splice(idx, 1);
    } else {
      this.editingProjectModel.devs.push(devId);
    }
  }

  onSubmit() {
    const payload: any = {
      name: this.newProject.name,
      description: this.newProject.description || 'New Project',
      budget: Number(this.newProject.budget),
      clients: this.newProject.clients.filter(id => id),
      devs: this.newProject.devs.filter(id => id)
    };

    this.projectService.createProject(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.newProject = { name: '', budget: 0, clients: [], devs: [], description: 'New Project' };
        if (this.selectedTab === 'archived') {
          this.switchTab('active');
        }
      },
      error: (err) => {
        console.error('Project creation failed:', err);
        alert('Failed to create project: ' + (err.error?.error || err.message));
      }
    });
  }

  startEdit(project: any, event: Event) {
    event.stopPropagation();

    this.editingProjectModel = {
      id: project.id || project._id,
      name: project.name,
      budget: project.budget,
      description: project.description || '',
      clients: (project.clients || []).map((c: any) => c.id || c._id || c),
      devs: (project.devs || []).map((d: any) => d.id || d._id || d)
    };

    this.showEditModal = true;
  }

  onEditSubmit() {
    const payload: any = {
      name: this.editingProjectModel.name,
      description: this.editingProjectModel.description,
      budget: Number(this.editingProjectModel.budget),
      clients: this.editingProjectModel.clients.filter(id => id),
      devs: this.editingProjectModel.devs.filter(id => id)
    };

    this.projectService.updateProject(this.editingProjectModel.id, payload).subscribe({
      next: () => {
        this.showEditModal = false;
      },
      error: (err) => {
        console.error('Project edit failed:', err);
        alert('Failed to update project');
      }
    });
  }

  archiveProject(project: any, event: Event) {
    event.stopPropagation();
    const projectId = project.id || project._id;
    if (confirm(`Are you sure you want to archive the project "${project.name}"?`)) {
      this.projectService.updateProject(projectId, { status: 'archived' }).subscribe({
        next: () => {
          this.projectService.projects.update(values => values.filter(p => p.id !== projectId && p._id !== projectId));
          this.expandedProjectId = null;
        },
        error: (err) => {
          console.error('Archive failed:', err);
          alert('Failed to archive project.');
        }
      });
    }
  }

  unarchiveProject(project: any, event: Event) {
    event.stopPropagation();
    const projectId = project.id || project._id;
    if (confirm(`Restore project "${project.name}" back to Active status?`)) {
      this.projectService.updateProject(projectId, { status: 'active' }).subscribe({
        next: () => {
          this.projectService.projects.update(values => values.filter(p => p.id !== projectId && p._id !== projectId));
          this.expandedProjectId = null;
        },
        error: (err) => {
          console.error('Restore failed:', err);
          alert('Failed to restore project.');
        }
      });
    }
  }

  confirmDelete(project: any, event: Event) {
    event.stopPropagation();
    const projectId = project.id || project._id;
    if (confirm(`Are you sure you want to delete the project "${project.name}"? This action is permanent.`)) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          if (this.expandedProjectId === projectId) {
            this.expandedProjectId = null;
          }
        },
        error: (err) => {
          console.error('Delete failed:', err);
          alert('Failed to delete project.');
        }
      });
    }
  }

  toggleExpand(projectId: string, event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    if (this.expandedProjectId === projectId) {
      this.expandedProjectId = null;
    } else {
      this.expandedProjectId = projectId;
    }
  }

  isAssignedDev(project: any): boolean {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return false;
    return (project.devs || []).some((d: any) => d.id === userId || d._id === userId || d === userId);
  }

  isAssignedClient(project: any): boolean {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return false;
    return (project.clients || []).some((c: any) => c.id === userId || c._id === userId || c === userId);
  }

  assignSelf(project: any) {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return;

    const devsList = [...(project.devs || []).map((d: any) => d.id || d._id || d), userId];
    this.projectService.updateProject(project.id || project._id, { devs: devsList }).subscribe();
  }

  resignProject(project: any) {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return;

    const devsList = (project.devs || [])
      .map((d: any) => d.id || d._id || d)
      .filter((id: string) => id !== userId);

    this.projectService.updateProject(project.id || project._id, { devs: devsList }).subscribe();
  }

  claimProject(project: any) {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return;

    const clientsList = [...(project.clients || []).map((c: any) => c.id || c._id || c), userId];
    this.projectService.updateProject(project.id || project._id, { clients: clientsList }).subscribe();
  }

  resignClient(project: any) {
    const user = this.authService.currentUser();
    const userId = user?.id || user?._id;
    if (!userId) return;

    const clientsList = (project.clients || [])
      .map((c: any) => c.id || c._id || c)
      .filter((id: string) => id !== userId);

    this.projectService.updateProject(project.id || project._id, { clients: clientsList }).subscribe();
  }

  unassignAll(project: any) {
    this.projectService.updateProject(project.id || project._id, { clients: [], devs: [] }).subscribe();
  }
}
