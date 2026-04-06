import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * SafeHtmlPipe — 8.5 XSS Sanitization
 *
 * Usage: [innerHTML]="content | safeHtml"
 *
 * Strategy:
 *   - DomSanitizer.sanitize(SecurityContext.HTML, value) strips ALL event handlers
 *     (onerror, onload, onclick…), javascript: URLs, and inline scripts.
 *   - This is NOT bypassSecurityTrustHtml — we are not bypassing Angular's sanitizer,
 *     we are explicitly invoking it so the result is a trusted SafeHtml value.
 *   - If sanitize() returns null (input was fully dangerous), we return '' and log a warning.
 *
 * NEVER replace this pipe with bypassSecurityTrustHtml unless the source is a
 * hardcoded internal string — never on API data.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true,
  pure: true,   // pure = memoized — no performance cost on re-renders with same value
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): string {
    if (!value) return '';

    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, value);

    if (sanitized === null) {
      // Input was entirely stripped — log for monitoring (never swallow silently)
      console.warn('[SafeHtmlPipe] Content was fully sanitized away — potential XSS attempt:', value.slice(0, 120));
      return '';
    }

    return sanitized;
  }
}
