import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  authService = inject(AuthService);
  
  profile = {
    name: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.profile.name = user.name;
      this.profile.email = user.email;
    }
  }

  onSubmit() {
    this.authService.updateProfile(this.profile).subscribe({
      next: (res) => {
        alert('Profile Updated Successfully');
        this.profile.password = ''; // Clear password field
      },
      error: (err) => alert('Update failed')
    });
  }
}
