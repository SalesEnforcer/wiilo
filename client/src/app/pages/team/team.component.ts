import { Component, inject, OnInit, signal, computed } from '@angular/core'; // Imported computed
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { SearchService } from '../../core/services/search.service'; // Import SearchService

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team.component.html',
})
export class TeamComponent implements OnInit {
  teamService = inject(TeamService);
  toastService = inject(ToastService);
  searchService = inject(SearchService); // Inject SearchService

  showModal = false;
  showEditModal = false;
  isLoading = signal(false); // Invite loading spinner

  selectedTab: 'active' | 'archived' = 'active'; // Current tab tracker

  newUser = { name: '', email: '', password: '', role: 'dev' };

  editingMemberModel = {
    id: '',
    name: '',
    role: 'dev'
  };

  // REACTIVE DYNAMIC ROSTER SEARCH FILTER
  filteredMembers = computed(() => {
    const q = this.searchService.query().toLowerCase().trim();
    const members = this.teamService.members();
    if (!q) return members;
    
    // Filters instantly through names, emails, or roles
    return members.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadTeam();
  }

  loadTeam() {
    const statusFilter = this.selectedTab === 'archived' ? 'archived' : undefined;
    this.teamService.getTeam(statusFilter).subscribe({
      error: () => this.toastService.show('Failed to load team list', 'error')
    });
  }

  switchTab(tab: 'active' | 'archived') {
    this.selectedTab = tab;
    this.loadTeam();
  }

  onSubmit() {
    this.isLoading.set(true);

    this.teamService.addMember(this.newUser).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showModal = false;
        this.newUser = { name: '', email: '', password: '', role: 'dev' };
        this.toastService.show('Member invited successfully', 'success');
        if (this.selectedTab === 'archived') {
          this.switchTab('active');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.show(err.error?.error || 'Failed to invite', 'error');
      }
    });
  }

  startEdit(member: any) {
    this.editingMemberModel = {
      id: member.id || member._id,
      name: member.name,
      role: member.role
    };
    this.showEditModal = true;
  }

  onEditSubmit() {
    const id = this.editingMemberModel.id;
    const payload = {
      name: this.editingMemberModel.name,
      role: this.editingMemberModel.role
    };

    this.teamService.updateMember(id, payload).subscribe({
      next: () => {
        this.showEditModal = false;
        this.toastService.show('Member profile updated successfully', 'success');
      },
      error: (err) => {
        this.toastService.show(err.error?.error || 'Failed to edit member', 'error');
      }
    });
  }

  archiveMember(member: any) {
    const id = member.id || member._id;
    if (confirm(`Are you sure you want to archive and deactivate ${member.name}? This will instantly ban them from logging in.`)) {
      this.teamService.updateMember(id, { isActive: false }).subscribe({
        next: () => {
          this.teamService.members.update(prev => prev.filter(m => m.id !== id && m._id !== id));
          this.toastService.show('Member archived & banned successfully', 'success');
        },
        error: (err) => {
          this.toastService.show('Failed to archive member', 'error');
        }
      });
    }
  }

  unarchiveMember(member: any) {
    const id = member.id || member._id;
    if (confirm(`Restore ${member.name} to active team roster? This will reactivate their login access.`)) {
      this.teamService.updateMember(id, { isActive: true }).subscribe({
        next: () => {
          this.teamService.members.update(prev => prev.filter(m => m.id !== id && m._id !== id));
          this.toastService.show('Member restored & unbanned successfully', 'success');
        },
        error: (err) => {
          this.toastService.show('Failed to restore member', 'error');
        }
      });
    }
  }
}
