import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesPillarRowComponent, PillarDetailSchema } from './finaces-pillar-row.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest'; // IMPORT VITAL POUR VITEST

describe('FinacesPillarRowComponent', () => {
    let component: FinacesPillarRowComponent;
    let fixture: ComponentFixture<FinacesPillarRowComponent>;

    const mockPillar: PillarDetailSchema = {
        pillarKey: 'LIQUIDITE',
        label: 'Liquidité',
        score: 3.5,
        maxScore: 5,
        riskClass: 'MODERATE',
        rail: 'MCC',
        indicators: [{ name: 'Current Ratio', value: '1.2', score: 4.0, weight: 25, contribution: 1.0 }],
        signals: ['Signal 1'],
        trends: [{ name: 'Trend 1', direction: 'UP', slope: 0.05 }],
        comment: 'Test comment'
    };

    beforeAll(() => {
        // Mock window.matchMedia for Material/Animations inside JSDOM
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => false,
            }),
        });
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesPillarRowComponent, BrowserAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesPillarRowComponent);
        component = fixture.componentInstance;

        // Méthode Angular 14+ stricte pour instancier un Input requis
        fixture.componentRef.setInput('pillar', mockPillar);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display pillar label properly', () => {
        const header = fixture.debugElement.query(By.css('.pillar-name')).nativeElement;
        expect(header.textContent).toContain('Liquidité');
    });

    it('should compute progress correctly', () => {
        expect(component.getProgressValue()).toBe(70); // (3.5 / 5) * 100
    });

    it('should determine correct warning color class for MODERATE risk', () => {
        expect(component.getProgressColorClass()).toBe('bg-warning');
    });

    it('should emit toggleExpand when clicked', () => {
        // Utilisation de vi.spyOn spécifique à Vitest
        const emitSpy = vi.spyOn(component.toggleExpand, 'emit');
        component.onExpandToggle();
        expect(emitSpy).toHaveBeenCalledWith('LIQUIDITE');
    });
});
