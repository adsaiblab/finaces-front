import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GateDocumentOut } from '../../../../core/models/gate.model';

@Component({
    selector: 'app-documents-column',
    standalone: true,
    imports: [
        CommonModule, MatTableModule, MatButtonModule,
        MatIconModule, MatMenuModule, DragDropModule, MatTooltipModule
    ],
    templateUrl: './documents-column.component.html',
    styleUrl: './documents-column.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsColumnComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    @Input()
    set documents(data: GateDocumentOut[]) {
        this.dataSource.data = data || [];
    }

    @Output() fileDropped = new EventEmitter<File>();
    @Output() deleteDocument = new EventEmitter<string>();
    @Output() downloadDocument = new EventEmitter<string>();
    @Output() viewDetails = new EventEmitter<GateDocumentOut>();

    displayedColumns: string[] = ['document_type', 'fiscal_year', 'file_size', 'reliability_level', 'integrity_status', 'actions'];
    dataSource = new MatTableDataSource<GateDocumentOut>([]);
    isDragOver = false;

    triggerFileInput(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
            input.value = ''; // Reset pour permettre de re-sélectionner le même fichier
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.handleFile(event.dataTransfer.files[0]);
        }
    }

    private handleFile(file: File): void {
        const validExtensions = ['pdf', 'xls', 'xlsx', 'xlsm', 'zip'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (!fileExtension || !validExtensions.includes(fileExtension)) {
            alert('Format de fichier non supporté. Formats acceptés : PDF, Excel, ZIP.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('La taille du fichier ne doit pas dépasser 10 MB.');
            return;
        }

        this.fileDropped.emit(file);
    }

    formatBytes(bytes: number, decimals = 2): string {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'OK': return 'check_circle';
            case 'WARN': return 'warning';
            case 'KO': return 'error';
            default: return 'help';
        }
    }
}