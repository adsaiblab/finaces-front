import { Component } from '@angular/core';
import { AppLayoutComponent } from './core/layout/app-layout/app-layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppLayoutComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  title = 'FinaCES';
}