import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesEmptyStateComponent } from './finaces-empty-state.component';

describe('FinacesEmptyStateComponent', () => {
  let component: FinacesEmptyStateComponent;
  let fixture: ComponentFixture<FinacesEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesEmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
