import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Global query signal readable by any page component
  query = signal<string>('');
}
