import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ido-task-details-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Task detail</h1>
          <div class="muted">Info, comments, and completion</div>
        </div>
      </header>
      <article class="card">
        <strong>Task title</strong>
        <p class="muted">Due date, reminder, project, section, and assignee.</p>
      </article>
      <button class="hold-button" type="button" (pointerdown)="startHold()" (pointerup)="cancelHold()" (pointerleave)="cancelHold()">
        <span [style.width.%]="holdPercent()"></span>
        <b>Hold to complete</b>
      </button>
      <section class="comments">
        <h2>Comments</h2>
        <div class="list">
          <article class="card">No comments yet.</article>
        </div>
        <div class="comment-box">
          <input class="field" [(ngModel)]="comment" placeholder="Add a comment">
          <button class="primary-button" type="button">Send</button>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .hold-button {
      position: relative;
      width: 100%;
      height: 52px;
      margin: 14px 0;
      border: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #d8ebe5;
      color: #164f43;
    }
    .hold-button span {
      position: absolute;
      inset: 0 auto 0 0;
      background: #80c9b7;
      transition: width 80ms linear;
    }
    .hold-button b { position: relative; z-index: 1; }
    .comment-box { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 12px; }
  `]
})
export class TaskDetailsPageComponent {
  comment = '';
  private holdStartedAt = signal<number | null>(null);
  holdPercent = computed(() => {
    const started = this.holdStartedAt();
    return started ? Math.min(100, ((Date.now() - started) / 2000) * 100) : 0;
  });
  startHold(): void { this.holdStartedAt.set(Date.now()); }
  cancelHold(): void { this.holdStartedAt.set(null); }
}
