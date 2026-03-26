import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesSkeletonLoaderComponent } from './finaces-skeleton-loader.component';

describe('FinacesSkeletonLoaderComponent', () => {
    let component: FinacesSkeletonLoaderComponent;
    let fixture: ComponentFixture<FinacesSkeletonLoaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesSkeletonLoaderComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesSkeletonLoaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});