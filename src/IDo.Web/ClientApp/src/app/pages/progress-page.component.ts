import { Component } from '@angular/core';

@Component({
  selector: 'ido-progress-page',
  standalone: true,
  template: `
    <section class="page">
      <header class="page-header"><h1 class="page-title">Progress</h1></header>
      <div class="list">
        <article class="card"><div class="row"><strong>Today</strong><span>0%</span></div></article>
        <article class="card"><div class="row"><strong>Habits</strong><span>0%</span></div></article>
        <article class="card"><div class="row"><strong>Projects</strong><span>0%</span></div></article>
        <article class="card"><div class="row"><strong>Weekly activity</strong><span>0</span></div></article>
      </div>
    </section>
  `
})
export class ProgressPageComponent {}
