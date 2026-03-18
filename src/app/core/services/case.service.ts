import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CaseCreate,
    CaseStatus,
    EvaluationCaseOut,
    EvaluationCaseDetailOut,
    CaseStatusResponse,
    StatusTransition,
    BidderOut,
    DashboardStatsOut,
    ConvergenceChartOut,
    TensionAlertOut,
    GateDecisionSchema
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class CaseService {
    private apiUrl = `${environment.apiUrl}/cases`;
    private analyticsUrl = `${environment.apiUrl}/analytics`;
    private dashboardUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getCases(): Observable<EvaluationCaseOut[]> {
        return this.http.get<EvaluationCaseOut[]>(this.apiUrl);
    }

    getCaseDetail(caseId: string): Observable<EvaluationCaseDetailOut> {
        return this.http.get<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}`);
    }

    createCase(payload: CaseCreate): Observable<EvaluationCaseDetailOut> {
        return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, payload);
    }

    /**
     * Sauvegarde un brouillon du dossier en cours de création.
     * Permet d'enregistrer des données partielles.
     */
    saveCaseDraft(payload: Partial<CaseCreate>): Observable<EvaluationCaseDetailOut> {
        const draftPayload = { ...payload, status: 'DRAFT' };
        return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, draftPayload);
    }

    getCaseStatus(caseId: string): Observable<CaseStatusResponse> {
        return this.http.get<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`);
    }

    transitionStatus(
        caseId: string,
        payload: StatusTransition
    ): Observable<CaseStatusResponse> {
        return this.http.patch<CaseStatusResponse>(
            `${this.apiUrl}/${caseId}/status`,
            payload
        );
    }

    getBidders(): Observable<BidderOut[]> {
        return this.http.get<BidderOut[]>(`${this.apiUrl}/bidders`);
    }

    // =========================================================================
    // MÉTHODES POUR LE DASHBOARD (BLOC 0)
    // =========================================================================

    /**
     * Récupère les KPI agrégés pour le tableau de bord
     */
    getDashboardStats(): Observable<DashboardStatsOut> {
        return this.http.get<DashboardStatsOut>(this.dashboardUrl);
    }

    /**
     * Récupère les dossiers les plus récents
     * @param limit Nombre de dossiers à récupérer (défaut: 5)
     */
    getRecentCases(limit: number = 5): Observable<EvaluationCaseDetailOut[]> {
        const params = new HttpParams()
            .set('limit', limit.toString())
            .set('sort', '-updated_at');

        return this.http.get<EvaluationCaseDetailOut[]>(this.apiUrl, { params });
    }

    /**
     * Récupère les données de convergence pour le graphique
     * @param days Période en jours (défaut: 30)
     */
    getConvergenceChart(days: number = 30): Observable<ConvergenceChartOut> {
        const params = new HttpParams().set('days', days.toString());

        return this.http.get<ConvergenceChartOut>(`${this.analyticsUrl}/convergence`, { params });
    }

    /**
     * Récupère les dossiers présentant une tension (divergence MODERATE ou SEVERE)
     */
    getActiveTensionCases(): Observable<TensionAlertOut[]> {
        const params = new HttpParams().set('filter', 'divergence_level:MODERATE,SEVERE');

        return this.http.get<TensionAlertOut[]>(this.apiUrl, { params });
    }

    // =========================================================================
    // NOUVELLES MÉTHODES POUR LE GATE (BLOC 1B)
    // =========================================================================

    evaluateGate(caseId: string): Observable<GateDecisionSchema> {
        return this.http.post<GateDecisionSchema>(
            `${this.apiUrl}/${caseId}/gate/evaluate`,
            {}
        );
    }

    patchCaseStatus(caseId: string, status: string): Observable<EvaluationCaseDetailOut> {
        return this.http.patch<EvaluationCaseDetailOut>(
            `${this.apiUrl}/${caseId}`,
            { status }
        );
    }
}