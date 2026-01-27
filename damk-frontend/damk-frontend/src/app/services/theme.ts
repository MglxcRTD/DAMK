import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;

  constructor() {
    // Recuperamos la preferencia al cargar la web
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.aplicarTema();
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    this.aplicarTema();
  }

  private aplicarTema() {
    if (this.darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  isDark() { return this.darkMode; }
}