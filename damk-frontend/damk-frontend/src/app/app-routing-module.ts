import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Home } from './components/home/home';
import { Login } from './components/login/login';

const routes: Routes = [
  { path: 'registro', component: Registro },
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }