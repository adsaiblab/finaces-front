import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecisionRecapComponent } from './decision-recap.component';
import { EvaluationCaseDetailOut, CaseStatus, CaseType } from '../../../../core/models/case.model';

describe('DecisionRecapComponent', () => {
    let component: DecisionRecapComponent;
    let fixture: ComponentFixture<DecisionRecapComponent>;

    const mockCase: Partial<EvaluationCaseDetailOut> = {
        id: '123',
        status: CaseStatus.EXPERT_REVIEWED,
        bidder_name: 'Test Corp',
        mcc_score_final: 3.5,
        risk_class: 'MODERATE',
        tension_label: 'MODERATE',
        override_applied: false,
        stress_test_results: {
            stress60d: { status: 'LIMIT', minCash: -5000 },
            stress90d: { status: 'SOLVENT', minCash: 12000 }
        },
        system_alerts: ['Warning 1'],
        name: 'Test Case',
        country: 'MA',
        sector: 'CONSTRUCTION',
        contract_value: 1000000,
        contract_currency: 'MAD',
        contract_months: 12,
        case_type: CaseType.SINGLE,
        created_at: '',
        updated_at: '',
        created_by: ''
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DecisionRecapComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DecisionRecapComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('caseData', mockCase as EvaluationCaseDetailOut);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});