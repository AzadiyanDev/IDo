import { Component } from '@angular/core';

@Component({
  selector: 'ido-habits-page',
  standalone: true,
  template: `
    <section class="page">
      <header class="page-header">
        <h1 class="page-title">Habits</h1>
        <button class="icon-button" type="button" aria-label="Add habit">+</button>
      </header>
      <div class="list">
        <article class="card">
          <strong>Morning focus</strong>
          <p class="muted">Specific active days and rest days will render here.</p>
        </article>
      </div>
    </section>
  `
})
export class HabitsPageComponent {}
