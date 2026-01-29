import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; // <--- IMPORTANTE
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <--- FUNDAMENTAL
import { RouterModule } from '@angular/router'; // <--- NECESARIO

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Componentes
import { Registro } from './components/registro/registro';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Asignatura } from './components/asignatura/asignatura';
import { Perfil } from './components/perfil/perfil';

// Servicios
import { ApuntesService } from './services/apuntes';
import { Verificaciones } from './components/admin/verificaciones/verificaciones';

@NgModule({
  declarations: [
    App,
    Registro,
    Home,
    Login,
    Asignatura,
    Perfil,
    Verificaciones
  ],
  imports: [
    BrowserModule,
    CommonModule,      // <--- Provee *ngIf, *ngFor, [ngClass]
    AppRoutingModule,  // <--- Provee router-outlet
    HttpClientModule,
    FormsModule,        // <--- Provee [(ngModel)]
    ReactiveFormsModule,
    RouterModule       // <--- Refuerza el sistema de rutas
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    ApuntesService
  ],
  bootstrap: [App]
})
export class AppModule { }