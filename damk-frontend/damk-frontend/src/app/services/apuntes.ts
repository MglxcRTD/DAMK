import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApuntesService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/apuntes';

  async subirApunte(file: File, asignatura: string) {
    // Creamos un formulario virtual para enviar el archivo real a Java
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asignatura', asignatura);
    formData.append('titulo', file.name);

    // Lo enviamos directamente a tu Spring Boot
    return firstValueFrom(this.http.post(`${this.API_URL}/subir`, formData));
  }
}