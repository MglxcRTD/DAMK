import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApuntesService {
  // Asegúrate de que en environment.ts la url sea http://localhost:8080/api
  private apiUrl = `${environment.apiUrl}/apuntes`;

  constructor(private http: HttpClient) {}

  /**
   * Sube el archivo binario junto con los metadatos necesarios para Cloudinary
   */
  subirApunte(file: File, titulo: string, asignatura: string, curso: string, usuarioId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file); // El archivo PDF de 1.27MB
    formData.append('titulo', titulo);
    formData.append('asignatura', asignatura);
    formData.append('curso', curso);
    formData.append('usuarioId', usuarioId.toString());

    return this.http.post(`${this.apiUrl}/subir`, formData);
  }

  /**
   * Obtiene la lista de apuntes filtrada por asignatura directamente desde MySQL
   */
  getApuntesPorAsignatura(asignatura: string): Observable<any[]> {
    // Usamos encodeURIComponent por si la asignatura tiene espacios o tildes
    const asignaturaSafe = encodeURIComponent(asignatura);
    return this.http.get<any[]>(`${this.apiUrl}/${asignaturaSafe}`);
  }
}