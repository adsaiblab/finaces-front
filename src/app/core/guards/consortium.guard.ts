import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaseService } from '../services/case.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const consortiumGuard: CanActivateFn = (route) => {
    const caseService = inject(CaseService);
    const router = inject(Router);

    const caseId = route.parent?.paramMap.get('id');

    if (!caseId) {
        router.navigate(['/dashboard']);
        return false;
    }

    return caseService.getCaseDetail(caseId).pipe(
        map(detail => {
            if (detail.case_type === 'CONSORTIUM' || detail.case_type === 'LOTS') {
                return true;
            }
            router.navigate(['/dashboard']);
            return false;
        }),
        catchError(() => {
            router.navigate(['/dashboard']);
            return of(false);
        })
    );
};
