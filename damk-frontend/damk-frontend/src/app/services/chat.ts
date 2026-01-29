import { Injectable } from '@angular/core';
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

  constructor() {}

  conectar(userId: number): void {
    const socket = new SockJS('http://localhost:8080/ws-damk');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('[STOMP] ' + str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[CHAT] Conexión establecida para el usuario: ' + userId);
        
        // Suscripción al canal privado del usuario
        this.stompClient?.subscribe(`/user/${userId}/queue/mensajes`, (message: IMessage) => {
          if (message.body) {
            const data: MensajeDTO = JSON.parse(message.body);
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
   * El destino '/app/chat.enviar' debe coincidir con tu @MessageMapping en Java.
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