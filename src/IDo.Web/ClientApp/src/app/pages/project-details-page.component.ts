import { Component } from '@angular/core';
import { AddProjectTaskModalComponent } from '../modals/add-project-task-modal.component';

@Component({
  selector: 'ido-project-details-page',
  standalone: true,
  imports: [AddProjectTaskModalComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Project</h1>
          <div class="muted">Progress, sections, and members</div>
        </div>
      </header>
      <article class="card">
        <div class="row"><strong>Progress</strong><span>0%</span></div>
      </article>
      <h2>Sections</h2>
      <div class="list">
        <article class="card">Public section</article>
        <article class="card">Assigned section</article>
      </div>
      <ido-add-project-task-modal />
    </section>
  `
})
export class ProjectDetailsPageComponent {}
