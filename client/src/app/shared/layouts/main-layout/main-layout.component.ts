import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastComponent],
  templateUrl: './main-layout.component.html',
  styles: [`
    @keyframes progress { 0% { width: 0%; } 50% { width: 50%; } 100% { width: 100%; } }
    .animate-progress { animation: progress 2s infinite ease-in-out; }
    
    /* Slow, fluid bouncing animation for our minimalist speech bubble */
    @keyframes bounceSlow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .animate-bounce-slow { animation: bounceSlow 4s infinite ease-in-out; }
  `]
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  projectService = inject(ProjectService);
  loadingService = inject(LoadingService);
  toastService = inject(ToastService);
  router = inject(Router);

  isSidebarOpen = signal(false);
  isCollapsed = signal(false);

  // Client Projects List
  clientProjects = signal<any[]>([]);

  // Onboarding Tour Signals
  showTour = signal(false);
  tourStage = signal<number>(1); // Stage 1, 2, or 3
  tourStep = signal<number>(1);  // Step 1, 2, or 3 within the stage

  ngOnInit() {
    if (this.authService.getRole() === 'client') {
      this.projectService.getProjects().subscribe(res => {
        if(res.data) this.clientProjects.set(res.data);
      });
    }

    const tourCompleted = localStorage.getItem('wiilo_tour_completed');
    if (!tourCompleted) {
      this.showTour.set(true);
      const savedStage = localStorage.getItem('wiilo_tour_stage');
      const savedStep = localStorage.getItem('wiilo_tour_step');
      if (savedStage) this.tourStage.set(Number(savedStage));
      if (savedStep) this.tourStep.set(Number(savedStep));
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.url;
      const isBoardView = url.includes('/projects/') && !url.includes('/projects?');
      
      if (isBoardView) {
        const tourCompleted = localStorage.getItem('wiilo_tour_completed');
        const currentStage = localStorage.getItem('wiilo_tour_stage');
        
        if (!tourCompleted && (currentStage === '3' || !currentStage || Number(currentStage) < 3)) {
          this.tourStage.set(3);
          this.tourStep.set(1);
          this.showTour.set(true);
          localStorage.setItem('wiilo_tour_stage', '3');
          localStorage.setItem('wiilo_tour_step', '1');
        }
      }
    });
  }

  nextStep() {
    const currentStep = this.tourStep();
    const currentStage = this.tourStage();

    if (currentStage === 1) {
      if (currentStep < 3) {
        this.tourStep.set(currentStep + 1);
      } else {
        this.tourStage.set(2);
        this.tourStep.set(1);
        this.router.navigate(['/dashboard']);
      }
    } else if (currentStage === 2) {
      if (currentStep === 1) {
        this.tourStep.set(2);
        this.router.navigate(['/settings']);
      } else if (currentStep === 2) {
        this.tourStep.set(3);
        if (this.authService.getRole() === 'client') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/projects']);
        }
      } else {
        this.showTour.set(false);
        this.tourStage.set(3);
        this.tourStep.set(1);
        
        this.toastService.show('Home walkthrough complete! Open any Project Board to start the final workspace tour.', 'success');
      }
    } else if (currentStage === 3) {
      if (currentStep < 3) {
        this.tourStep.set(currentStep + 1);
      } else {
        this.showTour.set(false);
        localStorage.setItem('wiilo_tour_completed', 'true');
        this.toastService.show('Welcome Tour Completed! You are fully set up to use Wiilo.', 'success');
      }
    }

    localStorage.setItem('wiilo_tour_stage', this.tourStage().toString());
    localStorage.setItem('wiilo_tour_step', this.tourStep().toString());
  }

  skipTour() {
    localStorage.setItem('wiilo_tour_completed', 'true');
    this.showTour.set(false);
    this.toastService.show('Onboarding guide skipped.', 'info');
  }

  resetTour() {
    localStorage.removeItem('wiilo_tour_completed');
    localStorage.removeItem('wiilo_tour_stage');
    localStorage.removeItem('wiilo_tour_step');
    this.tourStage.set(1);
    this.tourStep.set(1);
    this.showTour.set(true);
    this.toastService.show('Onboarding guide restarted!', 'success');
  }

  toggleSidebar() { this.isCollapsed.update(v => !v); }
  toggleMobileSidebar() { this.isSidebarOpen.update(v => !v); }
  closeMobileSidebar() { this.isSidebarOpen.set(false); }
  logout() { this.authService.logout(); }
}
