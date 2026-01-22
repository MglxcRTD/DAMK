import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class Auth {
  private API_URL = 'http://localhost:8080/api/auth/';

  constructor(private http: HttpClient){ }
  
  registrar(usuario: any): Observable<any> {
    return this.http.post(this.API_URL + 'registro', usuario)
  }

  login(credentials: any): Observable<any> {
    return this.http.post(this.API_URL + 'login', credentials);
  }
}
