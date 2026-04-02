import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * FinacesTitleStrategy — UX-2 / S2
 * Lit le `title` défini sur chaque route et met à jour <title> + expose
 * le libellé courant via un signal pour l'afficher dans le header.
 */
@Injectable({ providedIn: 'root' })
export class FinacesTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title) {
      this.titleService.setTitle(title);
    } else {
      this.titleService.setTitle('FinaCES');
    }
  }

  /** Extrait uniquement le label court (après le tiret) pour le breadcrumb. */
  getPageLabel(snapshot: RouterStateSnapshot): string {
    const full = this.buildTitle(snapshot);
    if (!full) return '';
    const parts = full.split('—');
    return parts.length > 1 ? parts[1].trim() : full.trim();
  }
}
