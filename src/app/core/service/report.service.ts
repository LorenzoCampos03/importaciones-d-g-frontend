import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  /**
   * Genera y descarga el reporte PDF de una venta
   * @param saleId ID de la venta
   * @returns Observable con el blob del PDF
   */
  generateSaleReport(saleId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sale/${saleId}`, {
      responseType: 'blob'
    }).pipe(
      retry(1), // Reintentar una vez en caso de error
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP
   * @param error Error HTTP
   * @returns Observable con error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido al generar el reporte';

    if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else if (error.status === 401) {
      errorMessage = 'No tienes permisos para generar este reporte.';
    } else if (error.status === 404) {
      errorMessage = 'La venta solicitada no existe.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor al generar el reporte.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
    }

    console.error('Error en ReportService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Descarga automáticamente el PDF generado
   * @param blob Datos del PDF
   * @param filename Nombre del archivo (opcional)
   */
  downloadPdf(blob: Blob, filename: string = 'reporte_venta.pdf'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Abre el PDF en una nueva pestaña
   * @param blob Datos del PDF
   */
  openPdfInNewTab(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.focus();
    }
  }
}
