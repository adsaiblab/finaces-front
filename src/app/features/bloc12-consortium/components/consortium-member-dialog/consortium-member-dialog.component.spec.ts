import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsortiumMemberDialogComponent } from './consortium-member-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConsortiumMemberDialogComponent', () => {
    let component: ConsortiumMemberDialogComponent;
    let fixture: ComponentFixture<ConsortiumMemberDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConsortiumMemberDialogComponent, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: { close: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: {} }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConsortiumMemberDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});