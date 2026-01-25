import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  
  // This is the missing signal causing the error
  isLoading = signal(false);

  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  onSubmit() {
    if (this.isLoading()) return;
    
    this.isLoading.set(true);
    const credentials = { email: this.email, password: this.password };

    this.authService.login(credentials).subscribe({
      next: (res) => {
        this.toastService.show('Welcome back!', 'success');
        this.router.navigate(['/dashboard']);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Login Failed:', err);
        this.toastService.show(err.error?.error || 'Invalid credentials', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
