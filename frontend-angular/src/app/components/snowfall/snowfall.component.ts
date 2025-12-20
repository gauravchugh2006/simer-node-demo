import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Flake {
  id: number;
  delay: number;
  duration: number;
  left: number;
  size: number;
  opacity: number;
}

@Component({
  selector: 'app-snowfall',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="snowfall" aria-hidden="true">
      <span
        *ngFor="let flake of flakes"
        class="snowflake"
        [style.left.%]="flake.left"
        [style.animationDelay.s]="flake.delay"
        [style.animationDuration.s]="flake.duration"
        [style.width.px]="flake.size"
        [style.height.px]="flake.size"
        [style.opacity]="flake.opacity"
      ></span>
    </div>
  `
})
export class SnowfallComponent implements OnInit {
  @Input() count = 60;
  flakes: Flake[] = [];

  ngOnInit(): void {
    this.flakes = Array.from({ length: this.count }, (_, index) => this.createFlake(index));
  }

  private createFlake(id: number): Flake {
    return {
      id,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 12,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      opacity: 0.35 + Math.random() * 0.4
    };
  }
}
