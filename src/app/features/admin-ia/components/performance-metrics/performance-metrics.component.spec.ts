import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerformanceMetricsComponent } from './performance-metrics.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PerformanceMetricsComponent', () => {
    let component: PerformanceMetricsComponent;
    let fixture: ComponentFixture<PerformanceMetricsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PerformanceMetricsComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(PerformanceMetricsComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('metrics', {});
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});