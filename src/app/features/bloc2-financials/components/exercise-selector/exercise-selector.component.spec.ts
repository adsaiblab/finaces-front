import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseSelectorComponent } from './exercise-selector.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ExerciseSelectorComponent', () => {
    let component: ExerciseSelectorComponent;
    let fixture: ComponentFixture<ExerciseSelectorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExerciseSelectorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseSelectorComponent);
        component = fixture.componentInstance;

        // Règle du Manifeste : Utilisation de setInput pour le OnPush
        fixture.componentRef.setInput('years', [2023, 2022, 2021]);
        fixture.componentRef.setInput('selectedYear', 2023);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit yearChange when a different year is selected', () => {
        const emitSpy = vi.spyOn(component.yearChange, 'emit');
        component.selectYear(2022);
        expect(emitSpy).toHaveBeenCalledWith(2022);
    });

    it('should NOT emit yearChange when the already selected year is clicked', () => {
        const emitSpy = vi.spyOn(component.yearChange, 'emit');
        component.selectYear(2023); // 2023 est déjà sélectionné
        expect(emitSpy).not.toHaveBeenCalled();
    });
});