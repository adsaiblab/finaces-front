import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesPilotModeBannerComponent } from './finaces-pilot-mode-banner.component';
import { provideRouter } from '@angular/router';

describe('FinacesPilotModeBannerComponent', () => {
  let component: FinacesPilotModeBannerComponent;
  let fixture: ComponentFixture<FinacesPilotModeBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesPilotModeBannerComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesPilotModeBannerComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
