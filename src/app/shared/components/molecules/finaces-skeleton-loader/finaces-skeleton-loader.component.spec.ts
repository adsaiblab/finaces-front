import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesSkeletonLoaderComponent, SkeletonVariant } from './finaces-skeleton-loader.component';

describe('FinacesSkeletonLoaderComponent', () => {
  let component: FinacesSkeletonLoaderComponent;
  let fixture: ComponentFixture<FinacesSkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesSkeletonLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesSkeletonLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render card variant by default', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.skeleton-card')).toBeTruthy();
  });

  const variants: SkeletonVariant[] = ['card', 'table', 'chart', 'gauge', 'kpi', 'form', 'list', 'double'];

  variants.forEach((v) => {
    it(`should render without error for variant "${v}"`, async () => {
      fixture.componentRef.setInput('variant', v);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.variant()).toBe(v);
      expect(fixture.nativeElement.querySelector('.skeleton-host')).toBeTruthy();
    });
  });

  it('should compute iterableRows correctly', () => {
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();
    expect(component.iterableRows()).toHaveLength(5);
  });

  it('should update iterableRows when rows input changes', () => {
    fixture.componentRef.setInput('rows', 2);
    fixture.detectChanges();
    expect(component.iterableRows()).toHaveLength(2);

    fixture.componentRef.setInput('rows', 7);
    fixture.detectChanges();
    expect(component.iterableRows()).toHaveLength(7);
  });
});
