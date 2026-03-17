import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Le Signal contient l'état actuel du thème (true = dark mode)
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();

    // L'effect() surveille le Signal. À chaque changement, il exécute ce code :
    effect(() => {
      const dark = this.isDarkMode();
      if (dark) {
        // Active le mode "Abysse & Laiton"
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('finaces-theme', 'dark');
      } else {
        // Active le mode "Papier & Minéral"
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('finaces-theme', 'light');
      }
    });
  }

  private initTheme(): void {
    // 1. On vérifie si l'utilisateur a déjà choisi un thème auparavant
    const savedTheme = localStorage.getItem('finaces-theme');

    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      // 2. Sinon, on s'adapte aux préférences de son système d'exploitation
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }
  }

  // Méthode à appeler depuis le bouton de ton interface
  toggleTheme(): void {
    this.isDarkMode.update(currentValue => !currentValue);
  }
}