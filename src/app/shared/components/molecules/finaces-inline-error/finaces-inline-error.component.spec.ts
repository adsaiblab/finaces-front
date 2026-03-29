import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesInlineErrorComponent } from './finaces-inline-error.component';

describe('FinacesInlineErrorComponent', () => {
  let component: FinacesInlineErrorComponent;
  let fixture: ComponentFixture<FinacesInlineErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesInlineErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesInlineErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
