import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TensionComparisonComponent } from './tension-comparison.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TensionComparisonComponent', () => {
    let component: TensionComparisonComponent;
    let fixture: ComponentFixture<TensionComparisonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TensionComparisonComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TensionComparisonComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('mccScore', 3.5);
        fixture.componentRef.setInput('mccClass', 'MODERATE');
        fixture.componentRef.setInput('iaScore', 4.2);
        fixture.componentRef.setInput('iaClass', 'LOW');
        fixture.componentRef.setInput('deltaScore', 0.7);
        fixture.componentRef.setInput('classDivergence', true);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should assign correct color class for delta >= 0.5', () => {
        expect(component.getDeltaColorClass()).toBe('text-[color:var(--color-warning)]');
    });

    it('should render the delta score properly formatted', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('+0.70');
    });
});