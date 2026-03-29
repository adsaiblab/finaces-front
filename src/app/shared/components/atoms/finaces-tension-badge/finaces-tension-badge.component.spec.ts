import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesTensionBadgeComponent } from './finaces-tension-badge.component';

describe('FinacesTensionBadgeComponent', () => {
  let component: FinacesTensionBadgeComponent;
  let fixture: ComponentFixture<FinacesTensionBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesTensionBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesTensionBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display NONE level with convergence icon', async () => {
    fixture.componentRef.setInput('level', 'NONE');
    await fixture.whenStable();
    expect(component.tensionScheme()).toEqual(expect.objectContaining({ labelFr: 'Convergence' }));
  });

  it('should display delta with direction UP', async () => {
    fixture.componentRef.setInput('level', 'MODERATE');
    fixture.componentRef.setInput('delta', 0.15);
    fixture.componentRef.setInput('direction', 'UP');
    await fixture.whenStable();

    expect(component.displayDelta()).toBe('+0.15');
    expect(component.directionIcon()).toBe('trending_up');
  });

  it('should display negative delta with direction DOWN', async () => {
    fixture.componentRef.setInput('level', 'MILD');
    fixture.componentRef.setInput('delta', -0.08);
    fixture.componentRef.setInput('direction', 'DOWN');
    await fixture.whenStable();

    expect(component.displayDelta()).toBe('-0.08');
    expect(component.directionIcon()).toBe('trending_down');
  });
});
