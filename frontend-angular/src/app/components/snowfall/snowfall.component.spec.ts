import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnowfallComponent } from './snowfall.component';

describe('SnowfallComponent', () => {
  let fixture: ComponentFixture<SnowfallComponent>;
  let component: SnowfallComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnowfallComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(SnowfallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates flakes based on count', () => {
    component.count = 5;
    component.ngOnInit();
    expect(component.flakes.length).toBe(5);
  });
});
