import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BalanceCheckComponent } from './balance-check.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BalanceCheckComponent', () => {
    let component: BalanceCheckComponent;
    let fixture: ComponentFixture<BalanceCheckComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BalanceCheckComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BalanceCheckComponent);
        component = fixture.componentInstance;
    });

    it('should display as balanced when assets equal liabilities', () => {
        fixture.componentRef.setInput('totalAssets', 150000);
        fixture.componentRef.setInput('totalLiabilities', 150000);
        fixture.detectChanges();

        expect(component.isBalanced()).toBe(true);
        expect(component.difference()).toBe(0);
    });

    it('should display as unbalanced when there is a difference', () => {
        fixture.componentRef.setInput('totalAssets', 200000);
        fixture.componentRef.setInput('totalLiabilities', 150000);
        fixture.detectChanges();

        expect(component.isBalanced()).toBe(false);
        expect(component.difference()).toBe(50000);
    });
});