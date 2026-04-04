import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesInlineErrorComponent, ErrorCode } from './finaces-inline-error.component';

describe('FinacesInlineErrorComponent', () => {
  let component: FinacesInlineErrorComponent;
  let fixture: ComponentFixture<FinacesInlineErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesInlineErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesInlineErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── ErrorCode defaults ────────────────────────────────────────────────
  it('should default to generic errorCode', () => {
    expect(component.errorCode()).toBe('generic');
  });

  const errorCodes: ErrorCode[] = ['server', 'timeout', 'unauthorized', 'not-found', 'generic'];

  errorCodes.forEach((code) => {
    it(`should resolve non-empty title and message for errorCode "${code}"`, async () => {
      fixture.componentRef.setInput('errorCode', code);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.resolvedTitle().length).toBeGreaterThan(0);
      expect(component.resolvedMessage().length).toBeGreaterThan(0);
      expect(component.resolvedIcon().length).toBeGreaterThan(0);
    });
  });

  // ─── message override ────────────────────────────────────────────────
  it('should use explicit message over errorCode default', async () => {
    fixture.componentRef.setInput('message', 'Message personnalisé');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.resolvedMessage()).toBe('Message personnalisé');
  });

  it('should fall back to errorCode message when message input is empty', async () => {
    fixture.componentRef.setInput('errorCode', 'server');
    fixture.componentRef.setInput('message', '');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.resolvedMessage()).toContain('erreur interne');
  });

  // ─── canRetry signal ────────────────────────────────────────────────
  it('should allow retry when retryCount < maxRetries', async () => {
    fixture.componentRef.setInput('retryCount', 1);
    fixture.componentRef.setInput('maxRetries', 3);
    fixture.detectChanges();
    expect(component.canRetry()).toBe(true);
  });

  it('should block retry when retryCount >= maxRetries', async () => {
    fixture.componentRef.setInput('retryCount', 3);
    fixture.componentRef.setInput('maxRetries', 3);
    fixture.detectChanges();
    expect(component.canRetry()).toBe(false);
  });

  // ─── outputs ───────────────────────────────────────────────────
  it('should emit retry when canRetry is true', async () => {
    fixture.componentRef.setInput('retryCount', 0);
    fixture.componentRef.setInput('maxRetries', 3);
    fixture.detectChanges();
    let emitted = false;
    component.retry.subscribe(() => (emitted = true));
    component.onRetry();
    expect(emitted).toBe(true);
  });

  it('should NOT emit retry when canRetry is false', async () => {
    fixture.componentRef.setInput('retryCount', 3);
    fixture.componentRef.setInput('maxRetries', 3);
    fixture.detectChanges();
    let emitted = false;
    component.retry.subscribe(() => (emitted = true));
    component.onRetry();
    expect(emitted).toBe(false);
  });

  it('should emit ignore on onIgnore()', () => {
    let emitted = false;
    component.ignore.subscribe(() => (emitted = true));
    component.onIgnore();
    expect(emitted).toBe(true);
  });

  // ─── a11y ───────────────────────────────────────────────────
  it('should have role="alert" on the host element', () => {
    const el: HTMLElement = fixture.nativeElement;
    const host = el.querySelector('[role="alert"]');
    expect(host).toBeTruthy();
  });

  it('should render data-testid when testId input is set', async () => {
    fixture.componentRef.setInput('testId', 'dashboard-error');
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="dashboard-error"]')).toBeTruthy();
  });
});
