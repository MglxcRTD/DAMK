import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // Definimos las URLs base según la estructura del Backend
  private API_URL = 'http://localhost:8080/api/auth/';
  private USER_URL = 'http://localhost:8080/api/usuarios/'; 
  private ADMIN_URL = 'http://localhost:8080/api/admin/verificaciones/';
  // Nueva ruta para la creación de solicitudes por parte de alumnos
  private SOLICITUDES_URL = 'http://localhost:8080/api/solicitudes/';

  constructor(private http: HttpClient) { }
  
  registrar(usuario: any): Observable<any> {
    return this.http.post(this.API_URL + 'registro', usuario);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(this.API_URL + 'login', credentials, { 
      withCredentials: true 
    });
  }

  subirFoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.USER_URL + 'upload-pfp', formData, { 
      withCredentials: true 
    });
  }

  getPerfilActual(): Observable<any> {
    return this.http.get(this.USER_URL + 'me', { 
      withCredentials: true 
    });
  }

  // --- MÉTODOS PARA EL FLUJO DE PROFESOR ---

  /**
   * Envía los datos del formulario de solicitud del alumno al nuevo endpoint.
   */
  solicitarPuestoProfesor(datos: any): Observable<any> {
    return this.http.post(this.SOLICITUDES_URL + 'crear', datos, {
      withCredentials: true
    });
  }

  /**
   * Obtiene el estado de la solicitud del usuario actual para las notificaciones.
   * Este método es necesario para que el Home reciba el mensaje de aceptación/rechazo.
   */
  getMiEstadoSolicitud(): Observable<any> {
    return this.http.get(this.SOLICITUDES_URL + 'me', {
      withCredentials: true
    });
  }

  /**
   * Obtiene la lista de alumnos que quieren ser profesores (Solo para Admin)
   */
  getSolicitudesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(this.ADMIN_URL + 'pendientes', {
      withCredentials: true
    });
  }

  /**
   * Acepta o rechaza una solicitud específica (Solo para Admin)
   * decision: { estado: 'ACEPTADA' | 'RECHAZADA', mensaje: string }
   */
  resolverSolicitud(idSolicitud: number, decision: any): Observable<any> {
    return this.http.post(`${this.ADMIN_URL}${idSolicitud}/decidir`, decision, {
      withCredentials: true
    });
  }

  /**
   * Alias para getPerfilActual usado en la lógica de guardado de sesión
   */
  getMe(): Observable<any> {
    return this.getPerfilActual();
  }
}