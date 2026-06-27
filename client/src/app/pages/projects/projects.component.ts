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
  expandedProjectId: string | null = null; // Track currently expanded card ID

  clients: any[] = [];
  devs: any[] = [];

  newProject = {
    name: '',
    budget: 0,
    client: '',
    devs: [] as any,
    description: 'New Project'
  };

  ngOnInit() {
    this.projectService.getProjects().subscribe();

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

  onSubmit() {
    // Robust frontend packaging of payload to guarantee correct types to PostgreSQL
    const payload: any = {
      name: this.newProject.name,
      description: this.newProject.description || 'New Project',
      budget: Number(this.newProject.budget),
      client: null,
      devs: []
    };

    // Sanitize client UUID
    if (this.newProject.client && this.newProject.client !== 'undefined' && this.newProject.client.trim() !== '') {
      payload.client = this.newProject.client;
    }

    // Force devs to always be a clean array of strings
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
      },
      error: (err) => {
        console.error('Project creation failed:', err);
        alert('Failed to create project: ' + (err.error?.error || err.message));
      }
    });
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
