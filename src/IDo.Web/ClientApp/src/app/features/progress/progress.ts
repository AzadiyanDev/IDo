import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarService } from '../../core/calendar.service';
import { I18nService } from '../../core/i18n.service';
import { HabitDto, HabitsService } from '../../core/habits.service';
import { ProgressDto, HabitProgressDto, ProgressService, ProjectProgressDto, WeeklyActivityDto } from '../../core/progress.service';
import { ProjectDto, ProjectsService } from '../../core/projects.service';
import { TaskDto, TodayDashboardDto, TodayService } from '../../core/today.service';

type RangeMode = 'today' | 'week' | 'month';
type Tone = 'blue' | 'green' | 'teal' | 'orange' | 'rose' | 'purple';

@Component({
  selector: 'app-progress',
  imports: [NgClass, RouterLink],
  template: `
    <header class="w-full top-0 sticky bg-theme-bg/95 backdrop-blur-md z-40 py-md">
      <div class="px-margin-mobile flex items-center justify-between gap-md">
        <div class="min-w-0">
          <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0 leading-tight">{{ i18n.text('Progress') }}</h1>
          <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ headerSubtitle() }}</p>
        </div>
        <button type="button" (click)="load()" class="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-on-surface hover:opacity-80 active:scale-95 transition-all" [attr.aria-label]="i18n.text('Refresh progress')">
          <span class="material-symbols-outlined" [class.animate-spin]="isLoading()">sync</span>
        </button>
      </div>
    </header>

    <div class="px-margin-mobile flex flex-col gap-lg pb-md">
      <section class="flex bg-theme-surface p-1 rounded-full border border-theme-border">
        @for (item of rangeOptions; track item.value) {
          <button
            type="button"
            (click)="range.set(item.value)"
            class="flex-1 h-10 rounded-full text-label-md font-label-md transition-all flex items-center justify-center gap-xs"
            [ngClass]="range() === item.value ? 'bg-theme-elevated text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'">
            <span class="material-symbols-outlined text-[17px]">{{ item.icon }}</span>
            {{ i18n.text(item.label) }}
          </button>
        }
      </section>

      @if (error()) {
        <section class="rounded-2xl border border-error/40 bg-error-container/30 text-on-error-container px-md py-sm text-body-md font-body-md">
          {{ error() }}
        </section>
      }

      @if (isLoading()) {
        <section class="bg-theme-surface rounded-2xl border border-theme-border p-lg h-[248px] animate-pulse"></section>
        <section class="grid grid-cols-2 gap-sm">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="h-[108px] rounded-2xl bg-theme-surface border border-theme-border animate-pulse"></div>
          }
        </section>
        <section class="h-[220px] rounded-2xl bg-theme-surface border border-theme-border animate-pulse"></section>
      } @else {
        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg overflow-hidden">
          <div class="flex items-start justify-between gap-lg">
            <div class="min-w-0">
              <div class="flex items-center gap-xs text-primary mb-xs">
                <span class="material-symbols-outlined text-[18px]">{{ focusIcon() }}</span>
                <span class="text-label-md font-label-md uppercase">{{ focusEyebrow() }}</span>
              </div>
              <h2 class="text-headline-md font-headline-md text-on-surface m-0">{{ focusTitle() }}</h2>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1 leading-relaxed">{{ focusDescription() }}</p>
            </div>

            <div class="relative w-[112px] h-[112px] shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 42 42">
                <circle class="fill-none stroke-theme-border" cx="21" cy="21" r="16" stroke-width="4" pathLength="100"></circle>
                <circle
                  class="fill-none transition-all duration-500"
                  cx="21"
                  cy="21"
                  r="16"
                  stroke-width="4"
                  pathLength="100"
                  stroke-linecap="round"
                  [attr.stroke]="focusColor()"
                  [attr.stroke-dasharray]="focusScore() + ' ' + (100 - focusScore())">
                </circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-display font-display text-on-surface leading-none">{{ focusScore() }}%</span>
                <span class="text-label-md font-label-md text-on-surface-variant mt-1">{{ focusMetricLabel() }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-sm border-t border-theme-border mt-lg pt-md">
            @for (item of heroStats(); track item.label) {
              <div class="min-w-0">
                <p class="text-label-md font-label-md text-on-surface-variant m-0 truncate">{{ item.label }}</p>
                <p class="text-body-lg font-body-lg text-on-surface font-semibold m-0 mt-1 truncate">{{ item.value }}</p>
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-elevated border border-theme-border rounded-2xl p-md flex items-start gap-md">
          <div class="w-10 h-10 rounded-full bg-theme-teal/15 flex items-center justify-center text-theme-teal shrink-0">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
          </div>
          <div class="min-w-0">
            <h3 class="text-body-md font-body-md text-theme-teal font-semibold m-0">{{ i18n.text('Performance signal') }}</h3>
            <p class="text-body-md font-body-md text-on-surface m-0 mt-1 leading-relaxed">{{ primaryInsight() }}</p>
          </div>
        </section>

        <section class="grid grid-cols-2 gap-sm">
          @for (card of kpiCards(); track card.label) {
            <div class="bg-theme-surface border border-theme-border rounded-2xl p-md min-h-[112px] flex flex-col justify-between">
              <div class="flex items-center justify-between gap-sm">
                <span class="text-label-md font-label-md text-on-surface-variant">{{ card.label }}</span>
                <span class="material-symbols-outlined text-[19px]" [ngClass]="toneTextClass(card.tone)">{{ card.icon }}</span>
              </div>
              <div>
                <p class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface m-0 leading-none">{{ card.value }}</p>
                <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-2 leading-tight">{{ card.detail }}</p>
              </div>
            </div>
          }
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg overflow-hidden">
          <div class="flex items-start justify-between gap-lg mb-lg">
            <div class="min-w-0">
              <div class="flex items-center gap-xs text-primary mb-xs">
                <span class="material-symbols-outlined text-[18px]">summarize</span>
                <span class="text-label-md font-label-md uppercase">{{ i18n.text('Executive report') }}</span>
              </div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ reportStatusTitle() }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1 leading-relaxed">{{ reportStatusDetail() }}</p>
            </div>

            <div class="relative w-[86px] h-[86px] shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 42 42">
                <circle class="fill-none stroke-theme-border" cx="21" cy="21" r="16" stroke-width="4" pathLength="100"></circle>
                <circle class="fill-none stroke-primary transition-all duration-500" cx="21" cy="21" r="16" stroke-width="4" pathLength="100" stroke-linecap="round" [attr.stroke-dasharray]="reportScore() + ' ' + (100 - reportScore())"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-headline-md font-headline-md text-on-surface leading-none">{{ reportScore() }}</span>
                <span class="text-[10px] leading-none text-on-surface-variant mt-1">{{ reportGrade() }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-sm">
            @for (item of reportHighlights(); track item.label) {
              <div class="min-h-[112px] rounded-2xl border border-theme-border bg-surface-container-lowest p-md flex flex-col justify-between gap-sm">
                <div class="flex items-center justify-between gap-sm">
                  <span class="text-label-md font-label-md text-on-surface-variant">{{ item.label }}</span>
                  <span class="material-symbols-outlined text-[18px]" [ngClass]="toneTextClass(item.tone)">{{ item.icon }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-body-lg font-body-lg text-on-surface font-semibold m-0 truncate">{{ item.value }}</p>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1 leading-tight">{{ item.detail }}</p>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md mb-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Health matrix') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Task, rhythm, habit, and project quality') }}</p>
            </div>
            <span class="text-label-md font-label-md text-primary">{{ healthSummaryLabel() }}</span>
          </div>

          <div class="flex flex-col gap-md">
            @for (metric of healthMetrics(); track metric.key) {
              <div>
                <div class="flex items-center justify-between gap-md mb-xs">
                  <div class="flex items-center gap-sm min-w-0">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" [ngClass]="toneSurfaceClass(metric.tone)">
                      <span class="material-symbols-outlined text-[19px]" [ngClass]="toneTextClass(metric.tone)">{{ metric.icon }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-body-md font-body-md text-on-surface font-semibold m-0 truncate">{{ metric.label }}</p>
                      <p class="text-label-md font-label-md text-on-surface-variant m-0 truncate">{{ metric.detail }}</p>
                    </div>
                  </div>
                  <span class="text-label-md font-label-md shrink-0" [ngClass]="toneTextClass(metric.tone)">{{ metric.score }}%</span>
                </div>
                <div class="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" [style.width.%]="metric.score" [style.background]="toneColor(metric.tone)"></div>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md mb-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Action plan') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Highest-impact next moves') }}</p>
            </div>
            <span class="material-symbols-outlined text-primary">route</span>
          </div>

          <div class="flex flex-col gap-sm">
            @for (action of actionPlan(); track action.label; let index = $index) {
              <div class="border border-theme-border rounded-2xl p-md flex items-start gap-md">
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" [ngClass]="toneSurfaceClass(action.tone)">
                  <span class="material-symbols-outlined text-[19px]" [ngClass]="toneTextClass(action.tone)">{{ action.icon }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-md">
                    <h4 class="text-body-lg font-body-lg text-on-surface m-0">{{ index + 1 }}. {{ action.label }}</h4>
                    <span class="text-label-md font-label-md shrink-0" [ngClass]="toneTextClass(action.tone)">{{ action.impact }}</span>
                  </div>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1 leading-relaxed">{{ action.detail }}</p>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md mb-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Work Mix') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text("Today's completion by category") }}</p>
            </div>
            <span class="text-label-md font-label-md text-primary">{{ workMixDoneLabel() }}</span>
          </div>

          <div class="flex flex-col gap-md">
            @for (category of categoryMetrics(); track category.key) {
              <div>
                <div class="flex items-center justify-between gap-md mb-xs">
                  <div class="flex items-center gap-sm min-w-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" [style.background]="category.surface">
                      <span class="material-symbols-outlined text-[18px]" [style.color]="category.color">{{ category.icon }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-body-md font-body-md text-on-surface font-semibold m-0 truncate">{{ category.label }}</p>
                      <p class="text-label-md font-label-md text-on-surface-variant m-0">{{ doneOfLabel(category.done, category.total) }}</p>
                    </div>
                  </div>
                  <span class="text-label-md font-label-md text-on-surface-variant shrink-0">{{ category.percentage }}%</span>
                </div>
                <div class="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" [style.width.%]="category.percentage" [style.background]="category.color"></div>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Weekly Trend') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ weeklyCompletionLabel() }} since {{ weekStartLabel() }}</p>
            </div>
            <div class="flex items-center gap-xs text-label-md font-label-md" [ngClass]="trendSignal().toneClass">
              <span class="material-symbols-outlined text-[18px]">{{ trendSignal().icon }}</span>
              {{ trendSignal().label }}
            </div>
          </div>

          <div class="flex items-end justify-between gap-xs h-[148px] mt-lg">
            @for (day of weeklyDays(); track day.key) {
              <div class="flex-1 min-w-0 flex flex-col items-center gap-xs">
                <div class="w-full h-[108px] flex items-end justify-center">
                  <div class="w-7 max-w-full rounded-full bg-theme-elevated border border-theme-border flex items-end overflow-hidden" [class.border-primary]="day.isToday">
                    <div class="w-full rounded-full transition-all duration-500" [style.height.%]="day.height" [style.background]="day.isToday ? '#00E6F6' : '#3EAEFF'"></div>
                  </div>
                </div>
                <span class="text-label-md font-label-md" [class.text-primary]="day.isToday" [class.text-on-surface-variant]="!day.isToday">{{ day.label }}</span>
                <span class="text-[10px] leading-none text-on-surface-variant">{{ day.value }}</span>
              </div>
            }
          </div>

          <div class="grid grid-cols-3 gap-sm border-t border-theme-border mt-md pt-md">
            <div>
              <p class="text-label-md font-label-md text-on-surface-variant m-0">{{ i18n.text('Best day') }}</p>
              <p class="text-body-md font-body-md text-on-surface font-semibold m-0 mt-1">{{ bestDay().label }} - {{ bestDay().value }}</p>
            </div>
            <div>
              <p class="text-label-md font-label-md text-on-surface-variant m-0">{{ i18n.text('Consistency') }}</p>
              <p class="text-body-md font-body-md text-on-surface font-semibold m-0 mt-1">{{ weekConsistency() }}%</p>
            </div>
            <div>
              <p class="text-label-md font-label-md text-on-surface-variant m-0">{{ i18n.text('Average') }}</p>
              <p class="text-body-md font-body-md text-on-surface font-semibold m-0 mt-1">{{ weeklyAveragePerDayLabel() }}</p>
            </div>
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md mb-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Process Flow') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Scope, execution, recovery, review') }}</p>
            </div>
            <span class="material-symbols-outlined text-primary">account_tree</span>
          </div>

          <div class="flex flex-col">
            @for (step of processSteps(); track step.label; let last = $last) {
              <div class="flex gap-md">
                <div class="flex flex-col items-center">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center" [ngClass]="toneSurfaceClass(step.tone)">
                    <span class="material-symbols-outlined text-[19px]" [ngClass]="toneTextClass(step.tone)">{{ step.icon }}</span>
                  </div>
                  <div class="w-px flex-1 bg-theme-border my-xs" [class.hidden]="last"></div>
                </div>
                <div class="flex-1 min-w-0 pb-md" [class.pb-0]="last">
                  <div class="flex items-center justify-between gap-md">
                    <h4 class="text-body-lg font-body-lg text-on-surface m-0">{{ step.label }}</h4>
                    <span class="text-body-md font-body-md text-on-surface font-semibold shrink-0">{{ step.value }}</span>
                  </div>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1 leading-relaxed">{{ step.detail }}</p>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="flex flex-col gap-md">
          <div class="flex items-center justify-between gap-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Habit Reliability') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ averageHabitSuccessLabel() }}</p>
            </div>
            <div class="text-end">
              <p class="text-label-md font-label-md text-on-surface-variant m-0">{{ i18n.text('Best streak') }}</p>
              <p class="text-body-lg font-body-lg text-theme-orange font-semibold m-0">{{ bestHabitStreakLabel() }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-sm">
            @for (habit of habitRows(); track habit.id) {
              <div class="bg-theme-surface border border-theme-border rounded-2xl p-md flex items-center gap-md">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" [style.background]="habit.surface">
                  <span class="material-symbols-outlined text-[20px]" [style.color]="habit.color">{{ habit.icon }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-md">
                    <h4 class="text-body-lg font-body-lg text-on-surface m-0 truncate">{{ habit.title }}</h4>
                    <span class="text-label-md font-label-md shrink-0" [ngClass]="habit.statusTone">{{ habit.status }}</span>
                  </div>
                  <div class="flex items-center gap-sm mt-xs">
                    <div class="h-2 bg-surface-container-high rounded-full overflow-hidden flex-1">
                      <div class="h-full rounded-full bg-theme-green transition-all duration-500" [style.width.%]="habit.successRate"></div>
                    </div>
                    <span class="text-label-md font-label-md text-on-surface-variant w-10 text-end">{{ habit.successRate }}%</span>
                  </div>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1">{{ habitReliabilityDetail(habit) }}</p>
                </div>
              </div>
            } @empty {
              <div class="bg-theme-surface border border-theme-border rounded-2xl p-lg text-center text-on-surface-variant">
                {{ i18n.text('No habit progress is available for this month yet.') }}
              </div>
            }
          </div>
        </section>

        <section class="flex flex-col gap-md">
          <div class="flex items-center justify-between gap-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Project Delivery') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ projectDeliveryLabel() }}</p>
            </div>
            <div class="relative w-[58px] h-[58px] flex items-center justify-center shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 42 42">
                <circle class="fill-none stroke-theme-border" cx="21" cy="21" r="16" stroke-width="4" pathLength="100"></circle>
                <circle class="fill-none stroke-theme-project-accent" cx="21" cy="21" r="16" stroke-width="4" pathLength="100" stroke-linecap="round" [attr.stroke-dasharray]="averageProjectProgress() + ' ' + (100 - averageProjectProgress())"></circle>
              </svg>
              <span class="absolute text-label-md font-label-md text-on-surface">{{ averageProjectProgress() }}%</span>
            </div>
          </div>

          <div class="flex flex-col gap-sm">
            @for (project of projectRows(); track project.id) {
              <a [routerLink]="['/project', project.id]" class="bg-theme-surface border border-theme-border rounded-2xl p-md flex items-center gap-md no-underline text-inherit active:scale-[0.98] transition-transform">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" [style.background]="project.surface">
                  <span class="material-symbols-outlined text-[20px]" [style.color]="project.color">{{ project.icon }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-md">
                    <h4 class="text-body-lg font-body-lg text-on-surface m-0 truncate">{{ project.title }}</h4>
                    <span class="text-label-md font-label-md text-on-surface-variant shrink-0">{{ project.percentage }}%</span>
                  </div>
                  <div class="h-2 bg-surface-container-high rounded-full overflow-hidden mt-xs">
                    <div class="h-full rounded-full transition-all duration-500" [style.width.%]="project.percentage" [style.background]="project.color"></div>
                  </div>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1">{{ projectRowDetail(project) }}</p>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </a>
            } @empty {
              <div class="bg-theme-surface border border-theme-border rounded-2xl p-lg text-center text-on-surface-variant">
                {{ i18n.text('No project progress is available yet.') }}
              </div>
            }
          </div>
        </section>

        <section class="bg-theme-surface border border-theme-border rounded-2xl p-lg">
          <div class="flex items-center justify-between gap-md mb-md">
            <div>
              <h3 class="text-headline-md font-headline-md text-on-surface m-0">{{ i18n.text('Recovery Queue') }}</h3>
              <p class="text-body-md font-body-md text-on-surface-variant m-0 mt-1">{{ overdueCountLabel() }}</p>
            </div>
            <span class="material-symbols-outlined" [ngClass]="overdueTasks().length > 0 ? 'text-theme-rose' : 'text-theme-green'">{{ overdueTasks().length > 0 ? 'warning' : 'check_circle' }}</span>
          </div>

          <div class="flex flex-col gap-sm">
            @for (task of overduePreview(); track task.id) {
              <a [routerLink]="['/task', task.id]" class="border border-theme-border rounded-2xl p-md no-underline text-inherit flex items-center gap-md hover:bg-surface-container-high transition-colors">
                <div class="w-9 h-9 rounded-full bg-theme-rose/15 flex items-center justify-center text-theme-rose shrink-0">
                  <span class="material-symbols-outlined text-[19px]">priority_high</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-body-md font-body-md text-on-surface m-0 font-semibold truncate">{{ task.title }}</p>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1 truncate">{{ overdueSubtitle(task) }}</p>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </a>
            } @empty {
              <div class="border border-theme-border rounded-2xl p-md flex items-center gap-md">
                <div class="w-9 h-9 rounded-full bg-theme-green/15 flex items-center justify-center text-theme-green shrink-0">
                  <span class="material-symbols-outlined text-[19px]">done_all</span>
                </div>
                <div>
                  <p class="text-body-md font-body-md text-on-surface m-0 font-semibold">{{ i18n.text('No overdue work') }}</p>
                  <p class="text-label-md font-label-md text-on-surface-variant m-0 mt-1">{{ i18n.text('Recovery is clear for today.') }}</p>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `
})
export class ProgressComponent {
  private readonly calendar = inject(CalendarService);
  readonly i18n = inject(I18nService);
  private readonly progressService = inject(ProgressService);
  private readonly todayService = inject(TodayService);
  private readonly habitsService = inject(HabitsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly today = new Date();
  private readonly todayKey = this.calendar.todayKey();
  private readonly weekStartKey = this.calendar.formatDateKey(this.calendar.startOfWeek(this.today));
  private readonly monthStartKey = this.calendar.formatDateKey(this.calendar.startOfCurrentMonth(this.today));

  readonly rangeOptions: { value: RangeMode; label: string; icon: string }[] = [
    { value: 'today', label: 'Today', icon: 'today' },
    { value: 'week', label: 'Week', icon: 'query_stats' },
    { value: 'month', label: 'Month', icon: 'calendar_month' }
  ];
  readonly range = signal<RangeMode>('week');
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<TodayDashboardDto | null>(null);
  readonly todayProgress = signal<ProgressDto | null>(null);
  readonly weeklyActivity = signal<WeeklyActivityDto | null>(null);
  readonly weeklyDashboards = signal<Record<string, TodayDashboardDto>>({});
  readonly habitProgress = signal<HabitProgressDto[]>([]);
  readonly projectProgress = signal<ProjectProgressDto[]>([]);
  readonly habits = signal<HabitDto[]>([]);
  readonly projects = signal<ProjectDto[]>([]);
  readonly overdueTasks = signal<TaskDto[]>([]);

  readonly summary = computed(() => this.dashboard()?.summary ?? null);
  readonly totalToday = computed(() => this.summary()
    ? this.summary()!.personalTaskCount + this.summary()!.habitCount + this.summary()!.projectTaskCount
    : 0);
  readonly completedToday = computed(() => this.summary()?.doneCount ?? 0);
  readonly leftToday = computed(() => Math.max(0, this.totalToday() - this.completedToday()));
  readonly todayCompletion = computed(() => this.clampPercent(Math.round(this.summary()?.donePercentage ?? 0)));
  readonly todayTaskCompletion = computed(() => this.clampPercent(Math.round(this.todayProgress()?.percentage ?? 0)));
  readonly averageHabitRate = computed(() => this.average(this.habitProgress().map(item => item.successRate)));
  readonly bestHabitStreak = computed(() => Math.max(0, ...this.habitProgress().map(item => item.bestStreak)));
  readonly portfolioDone = computed(() => this.projectProgress().reduce((sum, item) => sum + item.doneCount, 0));
  readonly portfolioTotal = computed(() => this.projectProgress().reduce((sum, item) => sum + item.totalCount, 0));
  readonly averageProjectProgress = computed(() => this.average(this.projectProgress().filter(item => item.totalCount > 0).map(item => item.percentage)));
  readonly reportScore = computed(() => {
    const baseScore = Math.round(
      this.todayCompletion() * 0.3 +
      this.todayTaskCompletion() * 0.2 +
      this.weekConsistency() * 0.2 +
      this.averageHabitRate() * 0.15 +
      this.averageProjectProgress() * 0.15
    );
    const overduePenalty = Math.min(20, this.overdueTasks().length * 5);
    const pendingPenalty = Math.min(8, (this.summary()?.pendingRequestCount ?? 0) * 2);
    return this.clampPercent(baseScore - overduePenalty - pendingPenalty);
  });
  readonly reportGrade = computed(() => {
    if (this.reportScore() >= 90) return 'A+';
    if (this.reportScore() >= 80) return 'A';
    if (this.reportScore() >= 70) return 'B';
    if (this.reportScore() >= 55) return 'C';
    return 'D';
  });

  readonly categoryMetrics = computed<CategoryMetric[]>(() => {
    const summary = this.summary();
    const personalDone = summary?.personalTaskDoneCount ?? 0;
    const habitDone = summary?.habitDoneCount ?? 0;
    const projectDone = summary?.projectTaskDoneCount ?? 0;
    const personalTotal = summary?.personalTaskCount ?? 0;
    const habitTotal = summary?.habitCount ?? 0;
    const projectTotal = summary?.projectTaskCount ?? 0;

    return [
      this.categoryMetric('personal', this.i18n.text('Personal Tasks'), 'checklist', personalDone, personalTotal, '#3EAEFF', 'rgba(62, 174, 255, 0.14)'),
      this.categoryMetric('habits', this.i18n.text('Habits'), 'repeat', habitDone, habitTotal, '#00F4B9', 'rgba(0, 244, 185, 0.14)'),
      this.categoryMetric('projects', this.i18n.text('Project Tasks'), 'assignment', projectDone, projectTotal, '#B072FF', 'rgba(176, 114, 255, 0.15)')
    ];
  });

  readonly weeklyDays = computed<WeeklyDay[]>(() => {
    const activity = this.weeklyActivity();
    const start = this.dateFromKey(activity?.weekStartDate ?? this.weekStartKey);
    const values = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.calendar.formatDateKey(date);
      const weeklyDashboard = this.weeklyDashboards()[key];
      return {
        key,
        label: this.calendar.weekdayLabel(date),
        value: weeklyDashboard?.summary.doneCount ?? activity?.completedCountByDate[key] ?? 0,
        isToday: key === this.todayKey
      };
    });
    const max = Math.max(1, ...values.map(day => day.value));
    return values.map(day => ({
      ...day,
      height: day.value === 0 ? 6 : Math.max(16, Math.round(day.value * 100 / max))
    }));
  });

  readonly weeklyTotal = computed(() => this.weeklyDays().reduce((sum, day) => sum + day.value, 0));
  readonly daysElapsedInWeek = computed(() => this.weeklyDays().filter(day => day.key <= this.todayKey).length || 1);
  readonly weeklyAverageLabel = computed(() => {
    const value = this.weeklyTotal() / this.daysElapsedInWeek();
    return value >= 10 ? `${Math.round(value)}` : value.toFixed(1).replace('.0', '');
  });
  readonly weeklyCompletionLabel = computed(() => this.i18n.language() === 'fa'
    ? `${this.i18n.number(this.weeklyTotal())} تکمیل`
    : `${this.weeklyTotal()} completion${this.weeklyTotal() === 1 ? '' : 's'}`);
  readonly weekConsistency = computed(() => {
    const elapsedDays = this.weeklyDays().filter(day => day.key <= this.todayKey);
    if (elapsedDays.length === 0) return 0;
    return this.clampPercent(Math.round(elapsedDays.filter(day => day.value > 0).length * 100 / elapsedDays.length));
  });
  readonly bestDay = computed(() => this.weeklyDays().reduce((best, day) => day.value > best.value ? day : best, this.weeklyDays()[0]));
  readonly trendSignal = computed(() => {
    const elapsed = this.weeklyDays().filter(day => day.key <= this.todayKey);
    const recent = elapsed.slice(-3).reduce((sum, day) => sum + day.value, 0);
    const previous = elapsed.slice(-6, -3).reduce((sum, day) => sum + day.value, 0);
    if (recent > previous) return { label: this.i18n.text('Improving'), icon: 'trending_up', toneClass: 'text-theme-green' };
    if (recent < previous) return { label: this.i18n.text('Cooling'), icon: 'trending_down', toneClass: 'text-theme-orange' };
    return { label: this.i18n.text('Stable'), icon: 'trending_flat', toneClass: 'text-primary' };
  });

  readonly healthMetrics = computed<HealthMetric[]>(() => [
    {
      key: 'today',
      label: this.i18n.text('Daily execution'),
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.completedToday())}/${this.i18n.number(this.totalToday())} آیتم برنامه امروز تکمیل شده`
        : `${this.completedToday()}/${this.totalToday()} items in today's plan are done`,
      score: this.todayCompletion(),
      icon: 'task_alt',
      tone: this.toneForScore(this.todayCompletion())
    },
    {
      key: 'weekly',
      label: this.i18n.text('Weekly rhythm'),
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.weekConsistency())}% ثبات در روزهای سپری‌شده`
        : `${this.weekConsistency()}% consistency across elapsed days`,
      score: this.weekConsistency(),
      icon: 'timeline',
      tone: this.toneForScore(this.weekConsistency())
    },
    {
      key: 'habits',
      label: this.i18n.text('Habit reliability'),
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.habitProgress().length)} عادت، میانگین ${this.i18n.number(this.averageHabitRate())}%`
        : `${this.habitProgress().length} habits, ${this.averageHabitRate()}% average`,
      score: this.averageHabitRate(),
      icon: 'repeat',
      tone: this.toneForScore(this.averageHabitRate())
    },
    {
      key: 'projects',
      label: this.i18n.text('Project delivery'),
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.portfolioDone())}/${this.i18n.number(this.portfolioTotal())} تسک پروژه تحویل شده`
        : `${this.portfolioDone()}/${this.portfolioTotal()} project tasks delivered`,
      score: this.averageProjectProgress(),
      icon: 'account_tree',
      tone: this.toneForScore(this.averageProjectProgress())
    }
  ]);

  readonly strongestMetric = computed(() => this.healthMetrics().reduce((best, metric) => metric.score > best.score ? metric : best, this.healthMetrics()[0]));
  readonly weakestMetric = computed(() => this.healthMetrics().reduce((weakest, metric) => metric.score < weakest.score ? metric : weakest, this.healthMetrics()[0]));

  readonly reportHighlights = computed<ReportHighlight[]>(() => [
    {
      label: this.i18n.text('Strongest signal'),
      value: this.strongestMetric().label,
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.strongestMetric().score)}% آماده و قابل اتکا`
        : `${this.strongestMetric().score}% is the most reliable area`,
      icon: 'verified',
      tone: 'green'
    },
    {
      label: this.i18n.text('Main bottleneck'),
      value: this.weakestMetric().label,
      detail: this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.weakestMetric().score)}%؛ بیشترین اثر اصلاح اینجاست`
        : `${this.weakestMetric().score}%; this is the highest-leverage fix`,
      icon: 'report',
      tone: this.weakestMetric().score >= 70 ? 'orange' : 'rose'
    },
    {
      label: this.i18n.text('Work pressure'),
      value: this.remainingLoadLabel(),
      detail: this.remainingLoadDetail(),
      icon: 'speed',
      tone: this.leftToday() === 0 ? 'green' : this.leftToday() <= 2 ? 'orange' : 'rose'
    },
    {
      label: this.i18n.text('Forecast'),
      value: this.completionForecastLabel(),
      detail: this.completionForecastDetail(),
      icon: 'insights',
      tone: this.todayCompletion() >= 80 ? 'green' : this.todayCompletion() >= 50 ? 'orange' : 'blue'
    }
  ]);

  readonly actionPlan = computed<ActionItem[]>(() => {
    const actions: ActionItem[] = [];

    if (this.overdueTasks().length > 0) {
      actions.push({
        label: this.i18n.text('Recover overdue work'),
        detail: this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.overdueTasks().length)} مورد عقب‌افتاده ریسک اصلی امروز است؛ از قدیمی‌ترین مورد شروع کن.`
          : `${this.overdueTasks().length} overdue item${this.overdueTasks().length === 1 ? '' : 's'} are today's main risk; start with the oldest one.`,
        impact: this.i18n.text('High'),
        icon: 'priority_high',
        tone: 'rose'
      });
    }

    if (this.leftToday() > 0) {
      actions.push({
        label: this.i18n.text('Close the current plan'),
        detail: this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.leftToday())} آیتم باقی مانده؛ تا قبل از افزودن کار جدید دامنه امروز را جمع کن.`
          : `${this.leftToday()} item${this.leftToday() === 1 ? '' : 's'} remain; close today's scope before adding new work.`,
        impact: this.leftToday() > 2 ? this.i18n.text('High') : this.i18n.text('Medium'),
        icon: 'checklist',
        tone: this.leftToday() > 2 ? 'orange' : 'teal'
      });
    }

    if (this.weekConsistency() < 60 && this.daysElapsedInWeek() > 1) {
      actions.push({
        label: this.i18n.text('Repair weekly rhythm'),
        detail: this.i18n.language() === 'fa'
          ? `ثبات هفته ${this.i18n.number(this.weekConsistency())}% است؛ یک تکمیل کوچک امروز ریتم را سریع‌تر ترمیم می‌کند.`
          : `Weekly consistency is ${this.weekConsistency()}%; one small completion today repairs the rhythm fastest.`,
        impact: this.i18n.text('Medium'),
        icon: 'calendar_view_week',
        tone: 'blue'
      });
    }

    if (this.averageHabitRate() < 65 && this.habitProgress().length > 0) {
      actions.push({
        label: this.i18n.text('Stabilize habits'),
        detail: this.i18n.language() === 'fa'
          ? `میانگین موفقیت عادت‌ها ${this.i18n.number(this.averageHabitRate())}% است؛ ضعیف‌ترین عادت را قبل از اضافه کردن روتین جدید تثبیت کن.`
          : `Habit success averages ${this.averageHabitRate()}%; stabilize the weakest routine before adding another one.`,
        impact: this.i18n.text('Medium'),
        icon: 'repeat',
        tone: 'green'
      });
    }

    if (this.averageProjectProgress() < 50 && this.projectProgress().some(item => item.totalCount > 0)) {
      actions.push({
        label: this.i18n.text('Unblock project delivery'),
        detail: this.i18n.language() === 'fa'
          ? `میانگین پیشرفت پروژه‌ها ${this.i18n.number(this.averageProjectProgress())}% است؛ پروژه کم‌پیشرفت‌تر را به یک تسک قابل تحویل بشکن.`
          : `Project progress averages ${this.averageProjectProgress()}%; split the slowest project into one deliverable task.`,
        impact: this.i18n.text('Medium'),
        icon: 'account_tree',
        tone: 'purple'
      });
    }

    if ((this.summary()?.pendingRequestCount ?? 0) > 0) {
      actions.push({
        label: this.i18n.text('Clear pending requests'),
        detail: this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.summary()?.pendingRequestCount ?? 0)} درخواست در inbox منتظر تصمیم است.`
          : `${this.summary()?.pendingRequestCount ?? 0} inbox request${(this.summary()?.pendingRequestCount ?? 0) === 1 ? '' : 's'} need a decision.`,
        impact: this.i18n.text('Low'),
        icon: 'inbox',
        tone: 'teal'
      });
    }

    if (actions.length === 0) {
      actions.push({
        label: this.i18n.text('Protect the current momentum'),
        detail: this.i18n.text('The report has no urgent risk. Keep the scope narrow and finish with a clean review.'),
        impact: this.i18n.text('Low'),
        icon: 'shield',
        tone: 'green'
      });
    }

    return actions.slice(0, 4);
  });

  readonly focusScore = computed(() => {
    switch (this.range()) {
      case 'today':
        return this.todayCompletion();
      case 'week':
        return this.weekConsistency();
      case 'month':
        return this.averageHabitRate();
    }
  });
  readonly focusEyebrow = computed(() => {
    switch (this.range()) {
      case 'today':
        return this.i18n.text('Today focus');
      case 'week':
        return this.i18n.text('Weekly process');
      case 'month':
        return this.i18n.text('Monthly health');
    }
  });
  readonly focusTitle = computed(() => {
    switch (this.range()) {
      case 'today':
        return this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.completedToday())} از ${this.i18n.number(this.totalToday())} مورد تکمیل شده`
          : `${this.completedToday()} of ${this.totalToday()} items completed`;
      case 'week':
        return this.i18n.language() === 'fa' ? `${this.weeklyCompletionLabel()} این هفته` : `${this.weeklyCompletionLabel()} this week`;
      case 'month':
        return this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.habitProgress().length)} عادت در حال بررسی`
          : `${this.habitProgress().length} habit${this.habitProgress().length === 1 ? '' : 's'} under review`;
    }
  });
  readonly focusDescription = computed(() => {
    switch (this.range()) {
      case 'today':
        return this.leftToday() === 0
          ? this.i18n.text('Today is fully cleared.')
          : this.i18n.language() === 'fa' ? `${this.i18n.number(this.leftToday())} مورد در برنامه فعلی مانده` : `${this.leftToday()} item${this.leftToday() === 1 ? '' : 's'} left in the current plan.`;
      case 'week':
        return this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.weekConsistency())}% ثبات در روزهای سپری‌شده هفته. روند خروجی: ${this.trendSignal().label}.`
          : `${this.weekConsistency()}% consistency across elapsed week days. ${this.trendSignal().label} output trend.`;
      case 'month':
        return this.i18n.language() === 'fa'
          ? `${this.i18n.number(this.averageHabitRate())}% میانگین موفقیت عادت‌ها با بهترین زنجیره ${this.i18n.number(this.bestHabitStreak())} روزه.`
          : `${this.averageHabitRate()}% average habit success with ${this.bestHabitStreak()} day best streak.`;
    }
  });
  readonly focusMetricLabel = computed(() => {
    switch (this.range()) {
      case 'today':
        return this.i18n.text('Complete');
      case 'week':
        return this.i18n.text('Consistent');
      case 'month':
        return this.i18n.text('Healthy');
    }
  });
  readonly focusIcon = computed(() => {
    switch (this.range()) {
      case 'today':
        return 'target';
      case 'week':
        return 'timeline';
      case 'month':
        return 'monitoring';
    }
  });

  readonly heroStats = computed(() => [
    { label: this.i18n.text('Done'), value: `${this.completedToday()}` },
    { label: this.i18n.text('Left'), value: `${this.leftToday()}` },
    { label: this.i18n.text('Overdue'), value: `${this.overdueTasks().length}` },
    { label: this.i18n.text('Pending'), value: `${this.summary()?.pendingRequestCount ?? 0}` }
  ]);

  readonly kpiCards = computed<KpiCard[]>(() => [
    { label: this.i18n.text('Today done'), value: `${this.completedToday()}/${this.totalToday()}`, detail: this.i18n.language() === 'fa' ? `${this.i18n.number(this.todayCompletion())}% تکمیل کل` : `${this.todayCompletion()}% total completion`, icon: 'task_alt', tone: 'blue' },
    { label: this.i18n.text('Task score'), value: `${this.todayTaskCompletion()}%`, detail: this.i18n.language() === 'fa' ? `${this.i18n.number(this.todayProgress()?.doneCount ?? 0)}/${this.i18n.number(this.todayProgress()?.totalCount ?? 0)} تسک قابل شمارش` : `${this.todayProgress()?.doneCount ?? 0}/${this.todayProgress()?.totalCount ?? 0} countable tasks`, icon: 'fact_check', tone: 'teal' },
    { label: this.i18n.text('Habit health'), value: `${this.averageHabitRate()}%`, detail: this.bestHabitStreakLabel(), icon: 'repeat', tone: 'green' },
    { label: this.i18n.text('Project flow'), value: `${this.averageProjectProgress()}%`, detail: this.i18n.language() === 'fa' ? `${this.i18n.number(this.portfolioDone())}/${this.i18n.number(this.portfolioTotal())} تسک تحویل‌شده` : `${this.portfolioDone()}/${this.portfolioTotal()} tasks delivered`, icon: 'account_tree', tone: 'purple' }
  ]);

  readonly processSteps = computed<ProcessStep[]>(() => [
    {
      label: this.i18n.text('Scope'),
      value: this.i18n.language() === 'fa' ? `${this.i18n.number(this.totalToday())} مورد` : `${this.totalToday()} item${this.totalToday() === 1 ? '' : 's'}`,
      detail: this.totalToday() === 0
        ? this.i18n.text('No scheduled work is blocking today.')
        : this.i18n.language() === 'fa' ? `${this.i18n.number(this.categoryMetrics().filter(item => item.total > 0).length)} جریان کاری فعال در برنامه امروز.` : `${this.categoryMetrics().filter(item => item.total > 0).length} active work stream${this.categoryMetrics().filter(item => item.total > 0).length === 1 ? '' : 's'} in today's plan.`,
      icon: 'view_list',
      tone: 'blue'
    },
    {
      label: this.i18n.text('Execution'),
      value: this.i18n.language() === 'fa' ? `${this.i18n.number(this.completedToday())} انجام شده` : `${this.completedToday()} done`,
      detail: this.i18n.language() === 'fa' ? `${this.i18n.number(this.todayCompletion())}% از کار برنامه‌ریزی‌شده کامل شده.` : `${this.todayCompletion()}% of the planned work is complete.`,
      icon: 'bolt',
      tone: this.todayCompletion() >= 80 ? 'green' : 'teal'
    },
    {
      label: this.i18n.text('Recovery'),
      value: this.i18n.language() === 'fa' ? `${this.i18n.number(this.overdueTasks().length)} عقب‌افتاده` : `${this.overdueTasks().length} overdue`,
      detail: this.overdueTasks().length > 0 ? this.i18n.text('Overdue work is the main risk in the current process.') : this.i18n.text('No overdue items are pulling down the plan.'),
      icon: this.overdueTasks().length > 0 ? 'priority_high' : 'verified',
      tone: this.overdueTasks().length > 0 ? 'rose' : 'green'
    },
    {
      label: this.i18n.text('Review'),
      value: this.i18n.language() === 'fa' ? `${this.i18n.number(this.weeklyTotal())} هفتگی` : `${this.weeklyTotal()} weekly`,
      detail: this.i18n.language() === 'fa' ? `${this.bestDay().label} با ${this.i18n.number(this.bestDay().value)} تکمیل قوی‌ترین روز است.` : `${this.bestDay().label} is the strongest day with ${this.bestDay().value} completion${this.bestDay().value === 1 ? '' : 's'}.`,
      icon: 'analytics',
      tone: 'purple'
    }
  ]);

  readonly habitRows = computed<HabitInsight[]>(() => {
    const habitMap = new Map(this.habits().map(habit => [habit.id, habit]));
    return this.habitProgress()
      .map(progress => {
        const habit = habitMap.get(progress.habitId);
        const successRate = this.clampPercent(Math.round(progress.successRate));
        return {
          id: progress.habitId,
          title: habit?.title ?? 'Habit',
          icon: habit?.icon || 'repeat',
          color: habit?.color || '#00F4B9',
          surface: this.colorSurface(habit?.color || '#00F4B9'),
          completedActiveDays: progress.completedActiveDays,
          totalActiveDays: progress.totalActiveDays,
          currentStreak: progress.currentStreak,
          successRate,
          status: this.habitStatus(successRate),
          statusTone: this.habitStatusTone(successRate)
        };
      })
      .sort((left, right) => left.successRate - right.successRate || right.currentStreak - left.currentStreak)
      .slice(0, 4);
  });

  readonly projectRows = computed<ProjectInsight[]>(() => {
    const projectMap = new Map(this.projects().map(project => [project.id, project]));
    return this.projectProgress()
      .map(progress => {
        const project = projectMap.get(progress.projectId);
        const percentage = this.clampPercent(Math.round(progress.percentage));
        const color = project?.color || '#B072FF';
        return {
          id: progress.projectId,
          title: project?.title ?? 'Project',
          icon: project?.icon || 'assignment',
          color,
          surface: this.colorSurface(color),
          doneCount: progress.doneCount,
          totalCount: progress.totalCount,
          percentage,
          status: this.projectStatus(progress, percentage)
        };
      })
      .sort((left, right) => left.percentage - right.percentage || right.totalCount - left.totalCount)
      .slice(0, 4);
  });

  readonly overduePreview = computed(() => this.overdueTasks().slice(0, 3));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const [dashboard, todayProgress, weeklyActivity, weeklyDashboards, habitProgress, projectProgress, habits, projects, overdueTasks] = await Promise.all([
        this.todayService.getToday(this.todayKey),
        this.progressService.getTodayProgress(this.todayKey),
        this.progressService.getWeeklyActivity(this.weekStartKey),
        this.loadWeeklyDashboards(),
        this.progressService.getHabitProgress(this.monthStartKey, this.todayKey),
        this.progressService.getProjectProgress(),
        this.habitsService.getHabits(),
        this.projectsService.getProjects(),
        this.progressService.getOverdueTasks(this.todayKey)
      ]);

      this.dashboard.set(dashboard);
      this.todayProgress.set(todayProgress);
      this.weeklyActivity.set(weeklyActivity);
      this.weeklyDashboards.set(weeklyDashboards);
      this.habitProgress.set(habitProgress);
      this.projectProgress.set(projectProgress);
      this.habits.set(habits);
      this.projects.set(projects);
      this.overdueTasks.set(overdueTasks);
    } catch (error) {
      this.error.set(this.messageFromError(error, 'Could not load progress analytics.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  headerSubtitle(): string {
    return this.i18n.language() === 'fa'
      ? `${this.shortDateLabel(this.today)} - تحلیل و جریان تحویل`
      : `${this.shortDateLabel(this.today)} - analytics and delivery flow`;
  }

  reportStatusTitle(): string {
    if (this.reportScore() >= 85) return this.i18n.text('Execution is strong');
    if (this.reportScore() >= 70) return this.i18n.text('Execution is controlled');
    if (this.reportScore() >= 55) return this.i18n.text('Execution needs focus');
    return this.i18n.text('Execution is at risk');
  }

  reportStatusDetail(): string {
    if (this.reportScore() >= 85) {
      return this.i18n.text('The current plan is healthy. Keep the day narrow and finish with review quality.');
    }

    if (this.overdueTasks().length > 0) {
      return this.i18n.language() === 'fa'
        ? `امتیاز کلی با ${this.i18n.number(this.overdueTasks().length)} مورد عقب‌افتاده پایین آمده؛ بازیابی قبل از توسعه دامنه اولویت دارد.`
        : `The overall score is pulled down by ${this.overdueTasks().length} overdue item${this.overdueTasks().length === 1 ? '' : 's'}; recover before expanding scope.`;
    }

    if (this.weakestMetric().score < 60) {
      return this.i18n.language() === 'fa'
        ? `${this.weakestMetric().label} ضعیف‌ترین بخش گزارش است و باید اولین نقطه اصلاح باشد.`
        : `${this.weakestMetric().label} is the weakest area in the report and should be fixed first.`;
    }

    return this.i18n.text('The report is balanced, but one focused completion will improve the score meaningfully.');
  }

  healthSummaryLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.reportScore())}% امتیاز کل`
      : `${this.reportScore()}% total score`;
  }

  remainingLoadLabel(): string {
    if (this.leftToday() === 0) return this.i18n.text('Clear');
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.leftToday())} مانده`
      : `${this.leftToday()} left`;
  }

  remainingLoadDetail(): string {
    if (this.leftToday() === 0) return this.i18n.text("No active load remains in today's plan.");
    const category = this.categoryMetrics().reduce((largest, item) => item.total > largest.total ? item : largest, this.categoryMetrics()[0]);
    return this.i18n.language() === 'fa'
      ? `بیشترین فشار امروز از ${category.label} می‌آید.`
      : `${category.label} carries the largest share of today's load.`;
  }

  completionForecastLabel(): string {
    if (this.totalToday() === 0) return this.i18n.text('No load');
    if (this.todayCompletion() >= 90) return this.i18n.text('Finish likely');
    if (this.todayCompletion() >= 60) return this.i18n.text('Recoverable');
    return this.i18n.text('Needs intervention');
  }

  completionForecastDetail(): string {
    if (this.totalToday() === 0) return this.i18n.text('There is no scheduled scope to forecast today.');
    const needed = Math.max(0, Math.ceil(this.totalToday() * 0.8) - this.completedToday());
    if (needed === 0) return this.i18n.text('The day is already above the 80% finish target.');
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(needed)} تکمیل دیگر، روز را به محدوده ۸۰٪ می‌رساند.`
      : `${needed} more completion${needed === 1 ? '' : 's'} move the day into the 80% finish zone.`;
  }

  primaryInsight(): string {
    if (this.overdueTasks().length > 0) {
      return this.i18n.language() === 'fa'
        ? `${this.i18n.number(this.overdueTasks().length)} مورد عقب‌افتاده باید قبل از اضافه کردن دامنه جدید بازیابی شود.`
        : `${this.overdueTasks().length} overdue item${this.overdueTasks().length === 1 ? '' : 's'} should be recovered before adding more scope.`;
    }

    if (this.todayCompletion() >= 85) {
      return this.i18n.text('Today is in strong shape. Keep the remaining work narrow and protect the current momentum.');
    }

    if (this.weekConsistency() < 50 && this.daysElapsedInWeek() > 1) {
      return this.i18n.text('The week has gaps in execution. A small completion today will improve consistency faster than expanding the plan.');
    }

    if (this.averageHabitRate() < 60 && this.habitProgress().length > 0) {
      return this.i18n.text('Habit reliability is the weak point this month. Stabilize the lowest-rate routine first.');
    }

    return this.i18n.language() === 'fa'
      ? `خروجی هفتگی ${this.trendSignal().label} با ${this.i18n.number(this.weeklyTotal())} مورد تکمیل‌شده تا اینجا.`
      : `${this.trendSignal().label} weekly output with ${this.weeklyTotal()} completed item${this.weeklyTotal() === 1 ? '' : 's'} so far.`;
  }

  workMixDoneLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.completedToday())}/${this.i18n.number(this.totalToday())} انجام شده`
      : `${this.completedToday()}/${this.totalToday()} done`;
  }

  doneOfLabel(done: number, total: number): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(done)} از ${this.i18n.number(total)}`
      : `${done} of ${total}`;
  }

  weeklyAveragePerDayLabel(): string {
    return this.i18n.language() === 'fa' ? `${this.weeklyAverageLabel()} / روز` : `${this.weeklyAverageLabel()}/day`;
  }

  averageHabitSuccessLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.averageHabitRate())}% میانگین موفقیت`
      : `${this.averageHabitRate()}% average success`;
  }

  bestHabitStreakLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.bestHabitStreak())} روز بهترین زنجیره`
      : `${this.bestHabitStreak()} day best streak`;
  }

  habitReliabilityDetail(habit: HabitInsight): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(habit.completedActiveDays)}/${this.i18n.number(habit.totalActiveDays)} روز فعال - ${this.i18n.number(habit.currentStreak)} زنجیره فعلی`
      : `${habit.completedActiveDays}/${habit.totalActiveDays} active days - ${habit.currentStreak} current streak`;
  }

  projectDeliveryLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.portfolioDone())}/${this.i18n.number(this.portfolioTotal())} تسک پروژه تکمیل شده`
      : `${this.portfolioDone()}/${this.portfolioTotal()} project tasks completed`;
  }

  projectRowDetail(project: ProjectInsight): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(project.doneCount)}/${this.i18n.number(project.totalCount)} انجام شده - ${project.status}`
      : `${project.doneCount}/${project.totalCount} done - ${project.status}`;
  }

  overdueCountLabel(): string {
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(this.overdueTasks().length)} مورد عقب‌افتاده`
      : `${this.overdueTasks().length} overdue item${this.overdueTasks().length === 1 ? '' : 's'}`;
  }

  focusColor(): string {
    switch (this.range()) {
      case 'today':
        return '#00E6F6';
      case 'week':
        return '#3EAEFF';
      case 'month':
        return '#00F4B9';
    }
  }

  weekStartLabel(): string {
    return this.shortDateLabel(this.dateFromKey(this.weekStartKey));
  }

  overdueSubtitle(task: TaskDto): string {
    const taskType = task.type as TaskDto['type'] | number;
    const type = taskType === 'Project' || taskType === 1 ? this.i18n.text('Project task') : this.i18n.text('Personal task');
    return this.i18n.language() === 'fa'
      ? `${type} - مهلت ${task.dueDate ? this.shortDateLabel(this.dateFromKey(task.dueDate)) : 'بدون تاریخ'}`
      : `${type} - due ${task.dueDate ? this.shortDateLabel(this.dateFromKey(task.dueDate)) : 'without date'}`;
  }

  toneTextClass(tone: Tone): string {
    switch (tone) {
      case 'blue':
        return 'text-theme-blue';
      case 'green':
        return 'text-theme-green';
      case 'teal':
        return 'text-theme-teal';
      case 'orange':
        return 'text-theme-orange';
      case 'rose':
        return 'text-theme-rose';
      case 'purple':
        return 'text-theme-purple';
    }
  }

  toneSurfaceClass(tone: Tone): string {
    switch (tone) {
      case 'blue':
        return 'bg-theme-blue/15';
      case 'green':
        return 'bg-theme-green/15';
      case 'teal':
        return 'bg-theme-teal/15';
      case 'orange':
        return 'bg-theme-orange/15';
      case 'rose':
        return 'bg-theme-rose/15';
      case 'purple':
        return 'bg-theme-purple/15';
    }
  }

  toneColor(tone: Tone): string {
    switch (tone) {
      case 'blue':
        return '#3EAEFF';
      case 'green':
        return '#00F4B9';
      case 'teal':
        return '#00E6F6';
      case 'orange':
        return '#FFC000';
      case 'rose':
        return '#FF3366';
      case 'purple':
        return '#B072FF';
    }
  }

  private categoryMetric(key: string, label: string, icon: string, done: number, total: number, color: string, surface: string): CategoryMetric {
    return {
      key,
      label,
      icon,
      done,
      total,
      color,
      surface,
      percentage: total === 0 ? 0 : this.clampPercent(Math.round(done * 100 / total))
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return this.clampPercent(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
  }

  private toneForScore(score: number): Tone {
    if (score >= 80) return 'green';
    if (score >= 60) return 'teal';
    if (score >= 40) return 'orange';
    return 'rose';
  }

  private habitStatus(successRate: number): string {
    if (successRate >= 80) return this.i18n.text('Reliable');
    if (successRate >= 55) return this.i18n.text('Watch');
    return this.i18n.text('At risk');
  }

  private habitStatusTone(successRate: number): string {
    if (successRate >= 80) return 'text-theme-green';
    if (successRate >= 55) return 'text-theme-orange';
    return 'text-theme-rose';
  }

  private projectStatus(progress: ProjectProgressDto, percentage: number): string {
    if (progress.totalCount === 0) return this.i18n.text('No tasks yet');
    if (percentage >= 90) return this.i18n.text('Almost done');
    if (percentage >= 50) return this.i18n.text('Moving');
    return this.i18n.language() === 'fa'
      ? `${this.i18n.number(Math.max(0, progress.totalCount - progress.doneCount))} مانده`
      : `${Math.max(0, progress.totalCount - progress.doneCount)} left`;
  }

  private colorSurface(color: string): string {
    if (!color.startsWith('#') || color.length !== 7) return 'rgba(255, 255, 255, 0.08)';
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, 0.14)`;
  }

  private async loadWeeklyDashboards(): Promise<Record<string, TodayDashboardDto>> {
    const entries = await Promise.all(this.weekKeys().map(async key => [key, await this.todayService.getToday(key)] as const));
    return Object.fromEntries(entries);
  }

  private weekKeys(): string[] {
    const weekStart = this.dateFromKey(this.weekStartKey);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return this.calendar.formatDateKey(date);
    });
  }

  private shortDateLabel(date: Date): string {
    return this.calendar.formatShortDate(date);
  }

  private dateFromKey(key: string): Date {
    return this.calendar.dateFromKey(key) ?? new Date();
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  private messageFromError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { errors?: string[]; error?: string } | null;
      if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors.join(' ');
      if (body?.error) return body.error;
    }

    return this.i18n.text(fallback);
  }
}

interface CategoryMetric {
  key: string;
  label: string;
  icon: string;
  done: number;
  total: number;
  color: string;
  surface: string;
  percentage: number;
}

interface WeeklyDay {
  key: string;
  label: string;
  value: number;
  height: number;
  isToday: boolean;
}

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: Tone;
}

interface ProcessStep {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: Tone;
}

interface ReportHighlight {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: Tone;
}

interface HealthMetric {
  key: string;
  label: string;
  detail: string;
  score: number;
  icon: string;
  tone: Tone;
}

interface ActionItem {
  label: string;
  detail: string;
  impact: string;
  icon: string;
  tone: Tone;
}

interface HabitInsight {
  id: string;
  title: string;
  icon: string;
  color: string;
  surface: string;
  completedActiveDays: number;
  totalActiveDays: number;
  currentStreak: number;
  successRate: number;
  status: string;
  statusTone: string;
}

interface ProjectInsight {
  id: string;
  title: string;
  icon: string;
  color: string;
  surface: string;
  doneCount: number;
  totalCount: number;
  percentage: number;
  status: string;
}
