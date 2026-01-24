import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service'; // <--- Import

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  projectService = inject(ProjectService);
  teamService = inject(TeamService);
  authService = inject(AuthService); // <--- Inject
  
  showModal = false;
  
  clients: any[] = [];
  devs: any[] = [];

  newProject = {
    name: '',
    budget: 0,
    client: '',
    devs: [],
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
    this.projectService.createProject(this.newProject).subscribe({
      next: () => {
        this.showModal = false;
        this.newProject = { name: '', budget: 0, client: '', devs: [], description: 'New Project' };
      },
      error: (err) => alert('Failed')
    });
  }
}
