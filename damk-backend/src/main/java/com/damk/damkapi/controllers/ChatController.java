package com.damk.damkapi.controllers;

import com.damk.damkapi.dtos.MensajeDTO;
import com.damk.damkapi.entities.Mensaje;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import com.damk.damkapi.services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Optional;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * El cliente envía a /app/chat.enviar
     */
    @MessageMapping("/chat.enviar")
    public void recibirMensaje(@Payload MensajeDTO mensajeDto, Principal principal) {

        // 1. Identificar al emisor de forma segura
        // Si principal.getName() devuelve el 'username', buscamos su ID en la DB
        Optional<Usuario> emisorOpt = usuarioRepository.findByUsername(principal.getName());

        if (emisorOpt.isPresent()) {
            Long emisorId = emisorOpt.get().getId();

            // 2. Guardar en la Base de Datos
            Mensaje mensajeGuardado = chatService.enviarMensaje(emisorId, mensajeDto);

            // 3. Preparar el DTO de salida para el receptor
            // Es vital enviar el ID del emisor para que la burbuja salga en el lado correcto
            MensajeDTO output = new MensajeDTO();
            output.setContenido(mensajeGuardado.getContenido());
            output.setEmisorId(emisorId);
            output.setReceptorId(mensajeDto.getReceptorId());
            output.setConversacionId(mensajeDto.getConversacionId());

            // 4. ENVÍO CRÍTICO
            // convertAndSendToUser construye la ruta: /user/{receptorId}/queue/mensajes
            System.out.println("[WS-SERVER] Reenviando mensaje de " + emisorId + " a " + mensajeDto.getReceptorId());

            messagingTemplate.convertAndSendToUser(
                    mensajeDto.getReceptorId().toString(),
                    "/queue/mensajes",
                    output
            );
        } else {
            System.err.println("[WS-SERVER] Error: No se encontró el usuario emisor " + principal.getName());
        }
    }
}