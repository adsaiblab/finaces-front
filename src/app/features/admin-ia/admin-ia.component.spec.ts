import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminIaComponent } from './admin-ia.component';
import { AdminIaService } from './services/admin-ia.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Mock du service pour isoler le test du composant parent
class MockAdminIaService {
    getDashboardData() {
        return of({
            models: [],
            active_model_config: {},
            global_metrics: {},
            feature_importance: [],
            alerts: []
        });
    }
}

describe('AdminIaComponent', () => {
    let component: AdminIaComponent;
    let fixture: ComponentFixture<AdminIaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminIaComponent, NoopAnimationsModule],
            providers: [
                { provide: AdminIaService, useClass: MockAdminIaService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminIaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});