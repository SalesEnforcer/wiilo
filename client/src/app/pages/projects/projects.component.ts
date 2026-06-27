import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';

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

  showModal = false;
  showEditModal = false;
  expandedProjectId: string | null = null; // Track currently expanded card ID
  selectedTab: 'active' | 'archived' = 'active'; // Current tab state

  clients: any[] = [];
  devs: any[] = [];

  newProject = {
    name: '',
    budget: 0,
    client: '',
    devs: [] as any,
    description: 'New Project'
  };

  editingProjectModel = {
    id: '',
    name: '',
    budget: 0,
    client: '',
    devs: [] as any,
    description: ''
  };

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

  onSubmit() {
    const payload: any = {
      name: this.newProject.name,
      description: this.newProject.description || 'New Project',
      budget: Number(this.newProject.budget),
      client: null,
      devs: []
    };

    if (this.newProject.client && this.newProject.client !== 'undefined' && this.newProject.client.trim() !== '') {
      payload.client = this.newProject.client;
    }

    if (this.newProject.devs) {
      if (Array.isArray(this.newProject.devs)) {
        payload.devs = this.newProject.devs.filter(id => id && id !== 'undefined' && id.trim() !== '');
      } else if (typeof this.newProject.devs === 'string' && this.newProject.devs !== 'undefined' && this.newProject.devs.trim() !== '') {
        payload.devs = [this.newProject.devs];
      }
    }

    this.projectService.createProject(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.newProject = { name: '', budget: 0, client: '', devs: [], description: 'New Project' };
        
        // If we are currently on the archived tab, switch back to active to see the newly created project
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
      client: project.client?.id || project.client?._id || project.client || '',
      devs: (project.devs || []).map((d: any) => d.id || d._id || d)
    };
    
    this.showEditModal = true;
  }

  onEditSubmit() {
    const payload: any = {
      name: this.editingProjectModel.name,
      description: this.editingProjectModel.description,
      budget: Number(this.editingProjectModel.budget),
      client: null,
      devs: []
    };

    if (this.editingProjectModel.client && this.editingProjectModel.client !== 'undefined' && this.editingProjectModel.client.trim() !== '') {
      payload.client = this.editingProjectModel.client;
    }

    if (this.editingProjectModel.devs) {
      if (Array.isArray(this.editingProjectModel.devs)) {
        payload.devs = this.editingProjectModel.devs.filter(id => id && id !== 'undefined' && id.trim() !== '');
      } else if (typeof this.editingProjectModel.devs === 'string' && this.editingProjectModel.devs !== 'undefined' && this.editingProjectModel.devs.trim() !== '') {
        payload.devs = [this.editingProjectModel.devs];
      }
    }

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
          // Optimistically remove from active list
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
          // Optimistically remove from archived list
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
    return project.client?.id === userId || project.client?._id === userId || project.client === userId;
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

    this.projectService.updateProject(project.id || project._id, { client: userId }).subscribe();
  }

  resignClient(project: any) {
    this.projectService.updateProject(project.id || project._id, { client: "" }).subscribe();
  }

  unassignAll(project: any) {
    this.projectService.updateProject(project.id || project._id, { client: "", devs: [] }).subscribe();
  }
}
