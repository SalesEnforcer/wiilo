import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs/operators';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Automatically bypass full-screen loader for real-time background actions
  // Added '/tasks' to make Kanban card movements, checklist changes, and status updates 100% instant and flicker-free!
  const isBackgroundRequest = req.url.includes('/messages') || 
                              req.url.includes('/chat/recent') || 
                              req.url.includes('/comments') ||
                              req.url.includes('/tasks') ||
                              req.headers.has('X-Skip-Loading');

  if (!isBackgroundRequest) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isBackgroundRequest) {
        loadingService.hide();
      }
    })
  );
};
