import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpertComponent } from './expert.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class StubDashboardComponent {}

describe('ExpertComponent', () => {
  let component: ExpertComponent;
  let fixture: ComponentFixture<ExpertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpertComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', component: StubDashboardComponent }]),
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
