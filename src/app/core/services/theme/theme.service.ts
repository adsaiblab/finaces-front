import { Injectable, signal, effect, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _isDark = signal<boolean>(false);
  readonly isDarkMode = this._isDark.asReadonly();
  
  private overlayContainer = inject(OverlayContainer);

  private readonly themeEffect = effect(() => {
    const isDark = this._isDark();
    const overlayClassList = this.overlayContainer.getContainerElement().classList;

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    overlayClassList.toggle('dark', isDark);
    localStorage.setItem('finaces-theme', isDark ? 'dark' : 'light');
  });

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('finaces-theme');
    if (savedTheme) {
      this._isDark.set(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this._isDark.set(prefersDark);
    }
  }

  toggleTheme(): void {
    this._isDark.update(v => !v);
  }
}
