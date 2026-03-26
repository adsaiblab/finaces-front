import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureImportanceComponent } from './feature-importance.component';

describe('FeatureImportanceComponent', () => {
    let component: FeatureImportanceComponent;
    let fixture: ComponentFixture<FeatureImportanceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeatureImportanceComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FeatureImportanceComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('features', []);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});