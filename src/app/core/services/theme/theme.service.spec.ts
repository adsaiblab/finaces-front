import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeAll(() => {
    // Mock natif de window.matchMedia pour éviter le crash dans JSDOM
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

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light mode', () => {
    expect(service.isDarkMode()).toBe(false);
  });

  it('should toggle to dark mode', () => {
    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.isDarkMode()).toBe(true);
  });

  it('should toggle back to light mode', () => {
    service.toggleTheme();
    TestBed.flushEffects();
    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.isDarkMode()).toBe(false);
  });

  it('should persist theme to localStorage when toggled', () => {
    service.toggleTheme();
    TestBed.flushEffects();
    expect(localStorage.getItem('finaces-theme')).toBe('dark');
    service.toggleTheme();
    TestBed.flushEffects();
    expect(localStorage.getItem('finaces-theme')).toBe('light');
  });

  describe('toggleTheme', () => {
    it('should toggle isDarkMode from false to true', () => {
        // Ensure we start light
        if (service.isDarkMode()) {
            service.toggleTheme();
        }
        expect(service.isDarkMode()).toBe(false);
        service.toggleTheme();
        expect(service.isDarkMode()).toBe(true);
    });

    it('should toggle isDarkMode from true to false', () => {
        // Ensure we start dark
        if (!service.isDarkMode()) {
            service.toggleTheme();
        }
        expect(service.isDarkMode()).toBe(true);
        service.toggleTheme();
        expect(service.isDarkMode()).toBe(false);
    });

    it('should set data-theme attribute on document', () => {
        TestBed.flushEffects();
        const theme = document.documentElement.getAttribute('data-theme');
        expect(theme).toBeTruthy();
        expect(['light', 'dark']).toContain(theme);
    });

    it('should persist theme preference to localStorage', () => {
        service.toggleTheme();
        TestBed.flushEffects();
        const saved = localStorage.getItem('finaces-theme');
        expect(saved).toBeTruthy();
        expect(['light', 'dark']).toContain(saved);
    });
  });
});