import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThemeService } from '../../services/theme/theme.service';
import { AuthService } from '../../services/auth.service';
import { FinacesTitleStrategy } from '../../strategies/finaces-title.strategy';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly titleStrategy = inject(FinacesTitleStrategy);
  private readonly authService = inject(AuthService);

  protected readonly isDark = this.themeService.isDarkMode;
  protected readonly toggleTheme = () => this.themeService.toggleTheme();
  protected readonly currentUser = this.authService.currentUser;
  isSidebarOpen = signal(true);

  /** Label court de la page courante (ex: "Tableau de Bord") pour le breadcrumb. */
  readonly pageLabel = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.titleStrategy.getPageLabel(this.router.routerState.snapshot)),
    ),
    { initialValue: this.titleStrategy.getPageLabel(this.router.routerState.snapshot) },
  );

  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
