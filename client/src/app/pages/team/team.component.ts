import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service'; // <--- Import

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team.component.html',
})
export class TeamComponent implements OnInit {
  teamService = inject(TeamService);
  toastService = inject(ToastService); // <--- Inject
  
  showModal = false;
  isLoading = signal(false); // <--- Loading State
  
  newUser = { name: '', email: '', password: '', role: 'dev' };

  ngOnInit() {
    this.teamService.getTeam().subscribe({
      error: () => this.toastService.show('Failed to load team', 'error')
    });
  }

  onSubmit() {
    this.isLoading.set(true); // Start Spinner
    
    this.teamService.addMember(this.newUser).subscribe({
      next: () => {
        this.isLoading.set(false); // Stop Spinner
        this.showModal = false;
        this.newUser = { name: '', email: '', password: '', role: 'dev' };
        this.toastService.show('Member invited successfully', 'success'); // <--- Nice Toast
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.show(err.error?.error || 'Failed to invite', 'error');
      }
    });
  }
}
