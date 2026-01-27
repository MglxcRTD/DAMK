import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private API_URL = 'http://localhost:8080/api/auth/';
  // --- ESTA ES LA LÍNEA QUE FALTABA ---
  private USER_URL = 'http://localhost:8080/api/usuarios/'; 

  constructor(private http: HttpClient){ }
  
  registrar(usuario: any): Observable<any> {
    return this.http.post(this.API_URL + 'registro', usuario);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(this.API_URL + 'login', credentials);
  }

  // Ahora ya no dará error porque USER_URL existe arriba
  getMe(): Observable<any> {
    return this.http.get(this.USER_URL + 'me', { withCredentials: true });
  }
}