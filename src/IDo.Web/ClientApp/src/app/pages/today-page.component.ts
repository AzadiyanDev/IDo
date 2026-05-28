import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ido-today-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Today</h1>
          <div class="muted">Daily execution</div>
        </div>
        <a routerLink="/progress" class="primary-button">Progress</a>
      </header>
      <div class="list">
        <article class="card"><div class="row"><strong>Personal tasks</strong><span>0</span></div></article>
        <article class="card"><div class="row"><strong>Habits</strong><span>0</span></div></article>
        <article class="card"><div class="row"><strong>Project tasks</strong><span>0</span></div></article>
        <article class="card"><div class="row"><strong>Task requests</strong><span>0</span></div></article>
      </div>
    </section>
  `
})
export class TodayPageComponent {}
