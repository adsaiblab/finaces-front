import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupementMembersComponent } from './groupement-members.component';
import { FormArray, FormBuilder } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

describe('GroupementMembersComponent', () => {
    let component: GroupementMembersComponent;
    let fixture: ComponentFixture<GroupementMembersComponent>;
    let fb: FormBuilder;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GroupementMembersComponent],
            providers: [provideAnimations()]
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        fixture = TestBed.createComponent(GroupementMembersComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('membersArray', fb.array([]));
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });
});