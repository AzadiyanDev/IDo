import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ido-projects-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <h1 class="page-title">Projects</h1>
        <button class="icon-button" type="button" aria-label="Add project">+</button>
      </header>
      <div class="list">
        <a class="card" routerLink="/projects/demo">
          <strong>Launch workspace</strong>
          <p class="muted">Sections, members, tasks, and progress.</p>
        </a>
      </div>
    </section>
  `,
  styles: [`a.card { color: inherit; text-decoration: none; display: block; }`]
})
export class ProjectsPageComponent {}
