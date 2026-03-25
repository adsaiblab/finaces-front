import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MilestoneTimelineComponent } from './milestone-timeline.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MilestoneTimelineComponent', () => {
    let component: MilestoneTimelineComponent;
    let fixture: ComponentFixture<MilestoneTimelineComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MilestoneTimelineComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(MilestoneTimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and initialize with one milestone', () => {
        expect(component).toBeTruthy();
        expect(component.milestonesArray.length).toBe(1);
    });

    it('should add and remove milestones', () => {
        component.addMilestone();
        expect(component.milestonesArray.length).toBe(2);

        component.removeMilestone(1);
        expect(component.milestonesArray.length).toBe(1);
    });
});