import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CaseContextService {
  private readonly _caseId = signal<string>('');
  readonly caseId = this._caseId.asReadonly();

  setCaseId(id: string): void {
    this._caseId.set(id);
  }
}
