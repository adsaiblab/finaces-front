import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RapportMetricsComponent } from './rapport-metrics.component';

describe('RapportMetricsComponent', () => {
  let component: RapportMetricsComponent;
  let fixture: ComponentFixture<RapportMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportMetricsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportMetricsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('label', 'Liquidity Ratio');
    fixture.componentRef.setInput('value', 1.5);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
