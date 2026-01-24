import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  
  authService = inject(AuthService);
  router = inject(Router);

  onSubmit() {
    console.log('?? Submitting Login...');
    const credentials = { email: this.email, password: this.password };
    
    this.authService.login(credentials).subscribe({
      next: (res) => {
        console.log('? API Success:', res);
        console.log('?? Checking Storage:', localStorage.getItem('token'));
        
        this.router.navigate(['/dashboard']).then(success => {
            console.log('Navigation result:', success ? 'Moved to Dashboard' : 'Navigation Failed');
        });
      },
      error: (err) => {
        console.error('? Login Failed:', err);
        alert('Login Failed: ' + (err.error?.error || 'Unknown error'));
      }
    });
  }
}
