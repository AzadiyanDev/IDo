import { Component } from '@angular/core';

@Component({
  selector: 'ido-add-project-task-modal',
  standalone: true,
  template: `
    <form class="card project-task-form">
      <strong>Add project task</strong>
      <input class="field" placeholder="Task title">
      <input class="field" placeholder="Section">
      <button class="primary-button" type="button">Create</button>
    </form>
  `,
  styles: [`.project-task-form { display: grid; gap: 10px; margin-top: 16px; }`]
})
export class AddProjectTaskModalComponent {}
