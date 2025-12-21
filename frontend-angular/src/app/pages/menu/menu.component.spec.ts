import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';

describe('MenuComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(MenuComponent);
    fixture.detectChanges();
  });

  it('initialises menu items', () => {
    const component = fixture.componentInstance;
    expect(component.items.length).toBeGreaterThan(0);
    expect(component.items[0].name).toBeDefined();
  });
});
