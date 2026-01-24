import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastComponent } from '../../components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  templateUrl: './main-layout.component.html',
  styles: [`
    @keyframes progress { 0% { width: 0%; } 50% { width: 50%; } 100% { width: 100%; } }
    .animate-progress { animation: progress 2s infinite ease-in-out; }
  `]
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  projectService = inject(ProjectService);
  loadingService = inject(LoadingService);
  router = inject(Router);
  
  isSidebarOpen = signal(false); 
  isCollapsed = signal(false);
  
  // Client Projects List
  clientProjects = signal<any[]>([]);

  ngOnInit() {
    // If Client, load projects for sidebar
    if (this.authService.getRole() === 'client') {
      this.projectService.getProjects().subscribe(res => {
        if(res.data) this.clientProjects.set(res.data);
      });
    }
  }

  toggleSidebar() { this.isCollapsed.update(v => !v); }
  toggleMobileSidebar() { this.isSidebarOpen.update(v => !v); }
  closeMobileSidebar() { this.isSidebarOpen.set(false); }
  logout() { this.authService.logout(); }
}
