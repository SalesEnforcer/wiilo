import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { LoadingService } from '../../../core/services/loading.service';
import { TeamService } from '../../../core/services/team.service';
import { SearchService } from '../../../core/services/search.service';
import { FeedbackService } from '../../../core/services/feedback.service'; // Import FeedbackService
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastComponent],
  templateUrl: './main-layout.component.html',
  styles: [`
    @keyframes progress { 0% { width: 0%; } 50% { width: 50%; } 100% { width: 100%; } }
    .animate-progress { animation: progress 2s infinite ease-in-out; }
    
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
  teamService = inject(TeamService);
  searchService = inject(SearchService);
  feedbackService = inject(FeedbackService); // Inject FeedbackService
  toastService = inject(ToastService);
  router = inject(Router);

  isSidebarOpen = signal(false);
  isCollapsed = signal(false);

  // Client Projects List
  clientProjects = signal<any[]>([]);

  // Search state
  searchQuery = '';
  searchResults = signal<any[]>([]); // Dropdown results

  // Feedback states
  showFeedbackModal = false;
  feedbackText = '';
  isSubmittingFeedback = false;

  // Onboarding Tour Signals
  showTour = signal(false);
  tourStage = signal<number>(1); // Stage 1, 2, or 3
  tourStep = signal<number>(1);  // Step 1, 2, or 3 within the stage

  ngOnInit() {
    this.projectService.getProjects().subscribe(res => {
      if (res.data && this.authService.getRole() === 'client') {
        this.clientProjects.set(res.data);
      }
    });

    if (this.authService.getRole() !== 'client') {
      this.teamService.getTeam().subscribe();
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

  onSearchChange() {
    this.searchService.query.set(this.searchQuery);

    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.searchResults.set([]);
      return;
    }

    const matches: any[] = [];

    // Search Projects
    const projs = this.projectService.projects();
    projs.forEach(p => {
      if (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
        matches.push({
          id: p.id || p._id,
          name: p.name,
          type: 'Project',
          path: '/' + (this.authService.getRole() === 'client' ? 'portal' : 'projects') + '/' + (p.id || p._id)
        });
      }
    });

    // Search Team Members (Admins and Devs only)
    if (this.authService.getRole() !== 'client') {
      const members = this.teamService.members();
      members.forEach(m => {
        if (m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q)) {
          matches.push({
            id: m.id || m._id,
            name: m.name,
            subText: m.role.toUpperCase() + ' • ' + m.email,
            type: 'Team Member',
            path: '/team'
          });
        }
      });
    }

    this.searchResults.set(matches.slice(0, 5));
  }

  selectResult(result: any) {
    this.router.navigate([result.path]);
    this.searchQuery = '';
    this.searchResults.set([]);
    this.searchService.query.set('');
  }

  onSearchBlur() {
    setTimeout(() => {
      this.searchResults.set([]);
    }, 200);
  }

  // Handle Feedback Submission
  onFeedbackSubmit() {
    if (!this.feedbackText.trim() || this.isSubmittingFeedback) return;

    this.isSubmittingFeedback = true;
    this.feedbackService.submitFeedback(this.feedbackText).subscribe({
      next: () => {
        this.toastService.show('Thank you! Your suggestion has been recorded successfully.', 'success');
        this.feedbackText = '';
        this.showFeedbackModal = false;
        this.isSubmittingFeedback = false;
      },
      error: (err) => {
        console.error('Feedback submit failed:', err);
        this.toastService.show('Failed to submit suggestion. Please try again.', 'error');
        this.isSubmittingFeedback = false;
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
