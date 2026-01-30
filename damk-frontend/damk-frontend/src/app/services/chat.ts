import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { MensajeDTO } from '../models/mensaje.dto'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private stompClient: Client | null = null;
  private mensajeSubject = new BehaviorSubject<MensajeDTO | null>(null);
  public nuevoMensaje$: Observable<MensajeDTO | null> = this.mensajeSubject.asObservable();

  // URL base para las peticiones REST del chat
  private API_CHAT_URL = 'http://localhost:8080/api/chat/';

  constructor(private http: HttpClient) {}

  /**
   * PERSISTENCIA DEL FEED:
   * Recupera la lista de usuarios con los que el usuario actual tiene chats activos.
   * Se usa en home.ts para llenar la lista de contactos al iniciar sesión.
   */
  getConversaciones(): Observable<any[]> {
    const options = {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest'
      })
    };
    // Llama al endpoint GET /api/chat/conversaciones que definimos en el controlador
    return this.http.get<any[]>(this.API_CHAT_URL + 'conversaciones', options);
  }

  /**
   * HISTORIAL PERSISTENTE:
   * Recupera los mensajes antiguos de la base de datos entre el usuario actual y el receptor.
   */
  getHistorial(receptorId: number): Observable<MensajeDTO[]> {
    const options = {
      withCredentials: true,
      headers: new HttpHeaders({
        'X-Requested-With': 'XMLHttpRequest'
      })
    };
    return this.http.get<MensajeDTO[]>(this.API_CHAT_URL + 'historial/' + receptorId, options);
  }

  conectar(userId: number): void {
    const socket = new SockJS('http://localhost:8080/ws-damk');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP] ' + str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[CHAT] Conexión establecida para el usuario: ' + userId);
        
        // Suscripción genérica: Spring gestiona la seguridad por el Principal (username)
        // en la ruta '/user/queue/mensajes'.
        this.stompClient?.subscribe('/user/queue/mensajes', (message: IMessage) => {
          if (message.body) {
            const data: MensajeDTO = JSON.parse(message.body);
            console.log('[CHAT] Mensaje recibido:', data);
            this.mensajeSubject.next(data);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[CHAT] Error de STOMP:', frame.headers['message']);
      }
    });

    this.stompClient.activate();
  }

  /**
   * Envía un mensaje al servidor mediante el protocolo STOMP.
   * El destino '/app/chat.enviar' debe coincidir con @MessageMapping en Java.
   */
  enviarMensaje(mensaje: MensajeDTO): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.enviar', 
        body: JSON.stringify(mensaje)
      });
    } else {
      console.error('[CHAT] No se pudo enviar el mensaje: Cliente no conectado.');
    }
  }

  desconectar(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      console.log('[CHAT] Desconectado');
    }
  }
}