import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-registro',
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
  standalone: false
})
export class Registro {

  usuario = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private authService: Auth, private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault(); 
    
    console.log('Enviando datos limpios a Java...', this.usuario);

    this.authService.registrar(this.usuario).subscribe({
      next: (res: any) => {
        
        Swal.fire({
          title: '¡Bienvenido a DAMK!',
          text: res.message || 'Registro completado con éxito',
          icon: 'success',
          confirmButtonColor: '#d9ff00', 
          timer: 2500,
          timerProgressBar: true
        });
        
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Error al registrar:', err);
        
        
        const mensajeError = err.error?.error || 'No hemos podido crear tu cuenta';

        Swal.fire({
          title: 'Vaya...',
          text: mensajeError,
          icon: 'error',
          confirmButtonColor: '#ff7675'
        });
      }
    });
  }

  loginGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginGithub() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/github';
  }
}