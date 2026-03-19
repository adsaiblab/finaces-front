import { Injectable, signal, effect, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);
  private overlayContainer = inject(OverlayContainer);

  constructor() {
    this.initTheme();

    effect(() => {
      const dark = this.isDarkMode();
      const overlayClassList = this.overlayContainer.getContainerElement().classList;

      if (dark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        overlayClassList.add('dark');
        localStorage.setItem('finaces-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        overlayClassList.remove('dark');
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
