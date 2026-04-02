import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FinacesConvergenceChartComponent } from './finaces-convergence-chart.component';
import { ConvergenceDataPoint } from '../../../../core/models/ia-admin.model';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

describe('FinacesConvergenceChartComponent', () => {
  let component: FinacesConvergenceChartComponent;
  let fixture: ComponentFixture<FinacesConvergenceChartComponent>;

  const mockData: ConvergenceDataPoint[] = [
    { epoch: 1, train_loss: 0.85, val_loss: 0.92, auc_roc: 0.51 },
    { epoch: 2, train_loss: 0.72, val_loss: 0.78, auc_roc: 0.63 },
    { epoch: 3, train_loss: 0.61, val_loss: 0.67, auc_roc: 0.74 },
    { epoch: 4, train_loss: 0.52, val_loss: 0.59, auc_roc: 0.81 },
    { epoch: 5, train_loss: 0.44, val_loss: 0.53, auc_roc: 0.87 },
  ];

  beforeAll(() => {
    if (typeof HTMLCanvasElement !== 'undefined') {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x: any, y: any, w: any, h: any) => ({ data: new Array(w * h * 4).fill(0) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Array(1).fill(0) }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: (text: string) => ({ width: text.length * 10 }),
        transform: () => {},
        rect: () => {},
        clip: () => {},
      } as any);
    }

    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  // waitForAsync : canvasRef est static:false (canvas dans @if)
  // => il n'est résolu qu'après detectChanges() + tick de la CD.
  beforeEach(waitForAsync(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesConvergenceChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesConvergenceChartComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('convergenceData', mockData);
    fixture.componentRef.setInput('height', 280);

    // Premier detectChanges : rend le template, résout canvasRef (static:false)
    fixture.detectChanges();
    // Attendre que tous les effets asynchrones (effect(), requestAnimationFrame mocké) soient flushés
    await fixture.whenStable();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with correct epoch labels', () => {
    const chartInstance = (component as any).chart;
    expect(chartInstance).toBeTruthy();
    expect(chartInstance.data.labels).toEqual(['E1', 'E2', 'E3', 'E4', 'E5']);
  });

  it('should render two datasets (train_loss and val_loss)', () => {
    const chartInstance = (component as any).chart;
    expect(chartInstance.data.datasets.length).toBe(2);
    expect(chartInstance.data.datasets[0].label).toBe('Train Loss');
    expect(chartInstance.data.datasets[1].label).toBe('Validation Loss');
  });

  it('should show empty state when convergenceData is empty', waitForAsync(async () => {
    fixture.componentRef.setInput('convergenceData', []);
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyState = fixture.nativeElement.querySelector('.convergence-empty');
    expect(emptyState).toBeTruthy();
  }));

  it('should clean up chart on component destroy', () => {
    // Le chart doit exister avant de tester destroy
    const chartInstance = (component as any).chart;
    expect(chartInstance).toBeTruthy();

    const destroySpy = vi.spyOn(chartInstance, 'destroy');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
