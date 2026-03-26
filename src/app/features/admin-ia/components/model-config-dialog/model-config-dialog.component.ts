import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-model-config-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './model-config-dialog.component.html',
    styleUrls: ['./model-config-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelConfigDialogComponent {
    data = inject(MAT_DIALOG_DATA);
    private dialogRef = inject(MatDialogRef<ModelConfigDialogComponent>);

    close(): void {
        this.dialogRef.close();
    }

    downloadConfig(): void {
        const blob = new Blob([JSON.stringify(this.data.config, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `model-config-${this.data.version}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}