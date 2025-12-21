import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeSwitcherComponent } from './theme-switcher.component';
import { ThemeService } from '../../services/theme.service';

describe('ThemeSwitcherComponent', () => {
  let fixture: ComponentFixture<ThemeSwitcherComponent>;
  let component: ThemeSwitcherComponent;
  let themeSpy: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    themeSpy = jasmine.createSpyObj('ThemeService', ['setTheme'], { activeTheme: { id: 'light' } });

    await TestBed.configureTestingModule({
      imports: [ThemeSwitcherComponent],
      providers: [{ provide: ThemeService, useValue: themeSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles dropdown visibility', () => {
    component.toggle();
    expect(component.open).toBeTrue();
  });

  it('selects theme and closes dropdown', () => {
    component.selectTheme('dark');
    expect(themeSpy.setTheme).toHaveBeenCalledWith('dark');
    expect(component.open).toBeFalse();
  });
});
