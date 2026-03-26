import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelListComponent } from './model-list.component';

describe('ModelListComponent', () => {
    let component: ModelListComponent;
    let fixture: ComponentFixture<ModelListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ModelListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ModelListComponent);
        component = fixture.componentInstance;

        // Règle 2 & 8 : Injection via setInput
        fixture.componentRef.setInput('models', []);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});