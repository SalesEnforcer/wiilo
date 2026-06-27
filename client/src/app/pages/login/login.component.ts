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

  // Password Recovery variables
  isResetView = signal(false); // Toggle in-place form transition
  resetEmail = '';

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
        // Clean, user-friendly error notice instead of generic details
        this.toastService.show('Incorrect email or password. Please try again.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onForgotPasswordSubmit() {
    if (this.isLoading() || !this.resetEmail.trim()) return;

    this.isLoading.set(true);
    this.authService.forgotPassword(this.resetEmail).subscribe({
      next: (res) => {
        this.toastService.show('Password reset link sent! Check your email.', 'success');
        this.isResetView.set(false); // Return to login form
        this.resetEmail = '';
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Password reset failed:', err);
        this.toastService.show(err.error?.error || 'Failed to send recovery link.', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
