import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  console.log('??? AuthGuard Checking. Token found?', token ? 'YES' : 'NO');

  if (token) {
    return true;
  } else {
    console.warn('? Access Denied. Redirecting to login.');
    router.navigate(['/login']);
    return false;
  }
};
