import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { DevDashboardComponent } from './dev-dashboard/dev-dashboard.component';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { RecentMessagesComponent } from '../../shared/components/recent-messages/recent-messages.component'; // <--- Import

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DevDashboardComponent, ClientDashboardComponent, RecentMessagesComponent], // <--- Add
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  projectService = inject(ProjectService);
  authService = inject(AuthService);
  
  activeProjectsCount = computed(() => this.projectService.projects().length);
  
  totalRevenue = computed(() => {
    return this.projectService.projects().reduce((acc, curr) => acc + (curr.budget || 0), 0);
  });

  ngOnInit() {
    if (this.authService.getRole() !== 'dev') {
        this.projectService.getProjects().subscribe();
    }
  }
}
