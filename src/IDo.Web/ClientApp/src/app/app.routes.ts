import {Routes} from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  { path: 'today', loadComponent: () => import('./features/today/today').then(m => m.TodayComponent) },
  { path: 'habits', loadComponent: () => import('./features/habits/habits').then(m => m.HabitsComponent) },
  { path: 'projects', loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent) },
  { path: 'progress', loadComponent: () => import('./features/progress/progress').then(m => m.ProgressComponent) },
  { path: 'inbox', loadComponent: () => import('./features/inbox/inbox').then(m => m.InboxComponent) },
  { path: 'project/:id', loadComponent: () => import('./features/projects/project-details').then(m => m.ProjectDetailsComponent) },
  { path: 'task/:id', loadComponent: () => import('./features/today/task-details').then(m => m.TaskDetailsComponent) }
];
