import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FinancialsComponent } from './financials.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { FinancialService } from '../../core/services/financial.service';
import { FinancialYearService } from '../../core/services/financial-year.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FinancialsComponent', () => {
  let component: FinancialsComponent;
  let fixture: ComponentFixture<FinancialsComponent>;

  const mockCaseContext = {
    caseId: signal('case-123'),
  };

  const mockFinancialService = {
    getFinancialStatements: vi.fn().mockReturnValue(of([])),
    createFinancialStatement: vi.fn(),
    normalizeFinancials: vi.fn(),
  };

  const mockFinancialYearService = {
    loadAvailableYears: vi.fn().mockReturnValue(of([2023])),
    addFiscalYear: vi.fn(),
  };

  const mockDialog = {
    open: vi.fn(),
  };

  const mockRouter = {
    navigate: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    mockFinancialService.getFinancialStatements.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FinancialsComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseContextService, useValue: mockCaseContext },
        { provide: FinancialService, useValue: mockFinancialService },
        { provide: FinancialYearService, useValue: mockFinancialYearService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize caseId from CaseContextService', () => {
    expect(component.caseId()).toBe('case-123');
  });

  it('should call getFinancialStatements on init', () => {
    expect(mockFinancialService.getFinancialStatements).toHaveBeenCalledWith('case-123');
  });
});
