import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // URLs base sincronizadas con el Backend
  private API_URL = 'http://localhost:8080/api/auth/';
  private USER_URL = 'http://localhost:8080/api/usuarios/'; 
  // ACTUALIZADO: Ahora cuelga de SOLICITUDES para coincidir con el Controller unificado
  private SOLICITUDES_URL = 'http://localhost:8080/api/solicitudes/';
  private AMISTADES_URL = 'http://localhost:8080/api/amistades/'; 

  /**
   * Configuración compartida para peticiones que requieren sesión (Cookies).
   */
  private get secureOptions() {
    return {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest'
      })
    };
  }

  constructor(private http: HttpClient) { }
  
  registrar(usuario: any): Observable<any> {
    return this.http.post(this.API_URL + 'registro', usuario);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(this.API_URL + 'login', credentials, this.secureOptions);
  }

  subirFoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.USER_URL + 'upload-pfp', formData, this.secureOptions);
  }

  getPerfilActual(): Observable<any> {
    return this.http.get(this.USER_URL + 'me', this.secureOptions);
  }

  // --- NUEVAS FUNCIONES PARA EL CHAT Y AMISTAD ---

  buscarUsuarios(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.USER_URL}buscar?query=${termino}`, this.secureOptions);
  }

  getTodosLosUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.USER_URL}todos`, this.secureOptions);
  }

  enviarSolicitudAmistad(emisorId: number, receptorId: number): Observable<any> {
    return this.http.post(this.AMISTADES_URL + 'solicitar', { emisorId, receptorId }, this.secureOptions);
  }

  // --- FLUJO DE SOLICITUD DE PROFESOR ---

  solicitarPuestoProfesor(datos: any): Observable<any> {
    return this.http.post(this.SOLICITUDES_URL + 'crear', datos, this.secureOptions);
  }

  getMiEstadoSolicitud(): Observable<any> {
    // Apunta a http://localhost:8080/api/solicitudes/me
    return this.http.get(this.SOLICITUDES_URL + 'me', this.secureOptions);
  }

  // --- MÉTODOS DE ADMINISTRACIÓN (ACTUALIZADOS PARA EVITAR 404) ---

  /**
   * Obtiene la lista de solicitudes de alumnos para ser profesores.
   * Nueva ruta: /api/solicitudes/admin/pendientes
   */
  getSolicitudesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.SOLICITUDES_URL}admin/pendientes`, this.secureOptions);
  }

  /**
   * Resuelve una solicitud (ACEPTADA o RECHAZADA)
   * Nueva ruta: /api/solicitudes/admin/{id}/decidir
   */
  resolverSolicitud(idSolicitud: number, decision: any): Observable<any> {
    return this.http.post(`${this.SOLICITUDES_URL}admin/${idSolicitud}/decidir`, decision, this.secureOptions);
  }

  getMe(): Observable<any> {
    return this.getPerfilActual();
  }

// En src/app/services/auth.ts
busquedaGlobal(termino: string): Observable<any> {
  // Quitamos "auth" de la URL. 
  // La URL final debe ser: http://localhost:8080/api/busqueda/global
  const BUSQUEDA_URL = 'http://localhost:8080/api/busqueda/global';
  return this.http.get(`${BUSQUEDA_URL}?q=${termino}`, this.secureOptions);
}
}