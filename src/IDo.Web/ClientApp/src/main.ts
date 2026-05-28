import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { TodayPageComponent } from './app/pages/today-page.component';
import { HabitsPageComponent } from './app/pages/habits-page.component';
import { ProjectsPageComponent } from './app/pages/projects-page.component';
import { ProjectDetailsPageComponent } from './app/pages/project-details-page.component';
import { TaskDetailsPageComponent } from './app/pages/task-details-page.component';
import { ProgressPageComponent } from './app/pages/progress-page.component';
import { ProfilePageComponent } from './app/pages/profile-page.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  { path: 'today', component: TodayPageComponent },
  { path: 'habits', component: HabitsPageComponent },
  { path: 'projects', component: ProjectsPageComponent },
  { path: 'projects/:id', component: ProjectDetailsPageComponent },
  { path: 'tasks/:id', component: TaskDetailsPageComponent },
  { path: 'progress', component: ProgressPageComponent },
  { path: 'profile', component: ProfilePageComponent }
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()]
}).catch(err => console.error(err));
