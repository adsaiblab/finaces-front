import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesIaUnavailableComponent } from './finaces-ia-unavailable.component';

describe('FinacesIaUnavailableComponent', () => {
  let component: FinacesIaUnavailableComponent;
  let fixture: ComponentFixture<FinacesIaUnavailableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesIaUnavailableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesIaUnavailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
