import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RapportGridComponent } from './rapport-grid.component';

describe('RapportGridComponent', () => {
    let component: RapportGridComponent;
    let fixture: ComponentFixture<RapportGridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RapportGridComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RapportGridComponent);
        component = fixture.componentInstance;

        // Proper signal input assignment for Vitest
        fixture.componentRef.setInput('title', 'Test Section');
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});