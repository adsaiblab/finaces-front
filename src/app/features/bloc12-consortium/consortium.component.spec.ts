import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsortiumComponent } from './consortium.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConsortiumComponent', () => {
    let component: ConsortiumComponent;
    let fixture: ComponentFixture<ConsortiumComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConsortiumComponent, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: 'dashboard', children: [] }])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConsortiumComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});