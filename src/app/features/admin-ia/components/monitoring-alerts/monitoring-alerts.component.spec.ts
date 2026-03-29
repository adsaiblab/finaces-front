import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoringAlertsComponent } from './monitoring-alerts.component';

describe('MonitoringAlertsComponent', () => {
  let component: MonitoringAlertsComponent;
  let fixture: ComponentFixture<MonitoringAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringAlertsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringAlertsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('alerts', []);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
