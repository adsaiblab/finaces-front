import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly isDark = this.themeService.isDarkMode;
  protected readonly toggleTheme = () => this.themeService.toggleTheme();
  isSidebarOpen = signal(true);

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }
}
