import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Registro } from './components/registro/registro';
import { FormsModule } from '@angular/forms';
import { Home } from './components/home/home';
import { Login } from './components/login/login';

@NgModule({
  declarations: [
    App,
    Registro,
    Home,
    Login
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule, 
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch())
  ],
  bootstrap: [App]
})
export class AppModule { }
