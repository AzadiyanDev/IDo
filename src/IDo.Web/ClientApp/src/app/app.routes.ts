import {Routes} from '@angular/router';
import {authGuard} from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/auth').then(m => m.AuthComponent), data: { mode: 'login' } },
  { path: 'register', loadComponent: () => import('./features/auth/auth').then(m => m.AuthComponent), data: { mode: 'register' } },
  { path: 'today', canActivate: [authGuard], loadComponent: () => import('./features/today/today').then(m => m.TodayComponent) },
  { path: 'habits', canActivate: [authGuard], loadComponent: () => import('./features/habits/habits').then(m => m.HabitsComponent) },
  { path: 'projects', canActivate: [authGuard], loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent) },
  { path: 'progress', canActivate: [authGuard], loadComponent: () => import('./features/progress/progress').then(m => m.ProgressComponent) },
  { path: 'inbox', canActivate: [authGuard], loadComponent: () => import('./features/inbox/inbox').then(m => m.InboxComponent) },
  { path: 'project/:id', canActivate: [authGuard], loadComponent: () => import('./features/projects/project-details').then(m => m.ProjectDetailsComponent) },
  { path: 'task/:id', canActivate: [authGuard], loadComponent: () => import('./features/today/task-details').then(m => m.TaskDetailsComponent) }
];
