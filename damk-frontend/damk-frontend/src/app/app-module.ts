import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; 
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router'; 

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// --- COMPONENTES ---
import { Registro } from './components/registro/registro';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Asignatura } from './components/asignatura/asignatura';
import { Perfil } from './components/perfil/perfil';
import { Verificaciones } from './components/admin/verificaciones/verificaciones';
// CORRECCIÓN: Quitamos el guion medio del nombre de la clase importada
import { MisApuntes } from './components/mis-apuntes/mis-apuntes'; 

// --- SERVICIOS ---
import { ApuntesService } from './services/apuntes';

@NgModule({
  declarations: [
    App,
    Registro,
    Home,
    Login,
    Asignatura,
    Perfil,
    Verificaciones,
    MisApuntes // <--- Ya está registrado aquí correctamente
  ],
  imports: [
    BrowserModule,
    CommonModule,      // Provee *ngIf, *ngFor, [ngClass]
    AppRoutingModule,  // Provee router-outlet
    HttpClientModule,
    FormsModule,       // Provee [(ngModel)]
    ReactiveFormsModule,
    RouterModule       // Refuerza el sistema de rutas
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    ApuntesService
  ],
  bootstrap: [App]
})
export class AppModule { }