import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { KanbanComponent } from './pages/kanban/kanban.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { TeamComponent } from './pages/team/team.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ClientProjectComponent } from './pages/client-project/client-project.component'; // <--- Import
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'projects/:id', component: KanbanComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'team', component: TeamComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'portal/:id', component: ClientProjectComponent } // <--- Added
    ]
  },
  
  { path: '**', redirectTo: 'login' }
];
