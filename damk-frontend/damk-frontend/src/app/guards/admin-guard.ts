import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userJson = localStorage.getItem('usuario');
    if (userJson) {
      const usuario = JSON.parse(userJson);
      // Solo permitimos el paso si el rol es exactamente ADMIN
      if (usuario.rol === 'ADMIN') {
        return true;
      }
    }
    
    // Si no es admin, lo redirigimos al Home para que no vea una página en blanco
    this.router.navigate(['/home']);
    return false;
  }
}