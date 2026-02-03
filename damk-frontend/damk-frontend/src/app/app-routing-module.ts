import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Asignatura } from './components/asignatura/asignatura';
import { Perfil } from './components/perfil/perfil';
import { Verificaciones } from './components/admin/verificaciones/verificaciones'; 
import { MisApuntes } from './components/mis-apuntes/mis-apuntes'; // <--- IMPORTACIÓN AÑADIDA
// 1. Importamos el Guard que creaste en la terminal
import { AdminGuard } from './guards/admin-guard';

const routes: Routes = [
  { path: 'registro', component: Registro },
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: 'asignatura/:nombre', component: Asignatura },
  { path: 'perfil', component: Perfil },
  
  // NUEVA RUTA PARA MIS APUNTES
  { path: 'mis-apuntes', component: MisApuntes }, // <--- RUTA AÑADIDA

  // 2. Protegemos la ruta con el Guard
  { 
    path: 'admin/verificaciones', 
    component: Verificaciones,
    canActivate: [AdminGuard] 
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }