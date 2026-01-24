import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  orgName = '';
  name = '';
  email = '';
  password = '';
  
  authService = inject(AuthService);
  router = inject(Router);

  onSubmit() {
    const payload = {
      orgName: this.orgName,
      name: this.name,
      email: this.email,
      password: this.password
    };
    
    this.authService.register(payload).subscribe({
      next: (res) => {
        console.log('Registration Success:', res);
        alert('Organization Created! Logged in as Super Admin.'); 
        // We will route to dashboard later, for now back to login or just alert
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration Failed:', err);
        alert('Error: ' + (err.error.error || 'Could not register'));
      }
    });
  }
}
