import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();

    effect(() => {
      const dark = this.isDarkMode();
      if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('finaces-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('finaces-theme', 'light');
      }
    });
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('finaces-theme');
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update(currentValue => !currentValue);
  }
}
