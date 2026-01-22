import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  sidebarOpen: boolean = true;

  usuarioActivo = {
    username: 'Pato', 
    puntos: 120,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  };


  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}