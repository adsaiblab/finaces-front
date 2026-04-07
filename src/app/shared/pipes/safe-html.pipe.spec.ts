import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
      providers: [SafeHtmlPipe]
    });
    pipe = TestBed.inject(SafeHtmlPipe);
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null, undefined, or empty string', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should allow safe HTML like headers, paragraphs, and bold text', () => {
    const safeHtml = '<h2>Title</h2><p>This is <strong>safe</strong> content.</p>';
    const result = pipe.transform(safeHtml);
    expect(result).toContain('<h2>Title</h2>');
    expect(result).toContain('<p>This is <strong>safe</strong> content.</p>');
  });

  it('should strip <script> tags completely (XSS mitigation)', () => {
    const xssPayload = '<p>Hello</p><script>alert("XSS")</script><div>World</div>';
    const result = pipe.transform(xssPayload);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert("XSS")');
    expect(result).toContain('<p>Hello</p>');
    expect(result).toContain('<div>World</div>');
  });

  it('should strip inline event handlers like onerror and onload (XSS mitigation)', () => {
    const xssPayload = '<img src="x" onerror="alert(1)" onload="fetch(\'bad\')">';
    const result = pipe.transform(xssPayload);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('<img src="x">');
  });

  it('should sanitize javascript: URIs in href and src attributes (XSS mitigation)', () => {
    const xssPayload = '<a href="javascript:alert(1)">Click me</a>';
    const result = pipe.transform(xssPayload);
    expect(result).not.toContain('javascript:alert(1)');
    // Angular DomSanitizer replaces dangerous URIs with unsafe:
    expect(result).toMatch(/unsafe:/);
    expect(result).toContain('Click me');
  });
});
