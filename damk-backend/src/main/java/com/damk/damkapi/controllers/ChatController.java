package com.damk.damkapi.controllers;

import com.damk.damkapi.dtos.MensajeDTO;
import com.damk.damkapi.entities.Mensaje;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.MensajeRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import com.damk.damkapi.services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MensajeRepository mensajeRepository;

    /**
     * PERSISTENCIA DEL FEED: Obtiene la lista de usuarios con los que el
     * usuario actual ha mantenido una conversación.
     */
    @GetMapping("/conversaciones")
    public ResponseEntity<List<Usuario>> obtenerConversacionesActivas(Principal principal) {
        Usuario usuario = usuarioRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario logueado no encontrado"));

        // El servicio debe buscar usuarios que sean emisores o receptores de mensajes con este usuario
        List<Usuario> contactos = chatService.obtenerContactosRecientes(usuario);

        return ResponseEntity.ok(contactos);
    }

    /**
     * HISTORIAL PERSISTENTE: Recupera los mensajes entre el usuario logueado y un receptor.
     */
    @GetMapping("/historial/{receptorId}")
    public ResponseEntity<List<MensajeDTO>> obtenerHistorial(@PathVariable Long receptorId, Principal principal) {
        Usuario emisor = usuarioRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Emisor no encontrado"));
        Usuario receptor = usuarioRepository.findById(receptorId)
                .orElseThrow(() -> new RuntimeException("Receptor no encontrado"));

        List<Mensaje> historial = mensajeRepository.findChatHistory(emisor, receptor);

        List<MensajeDTO> dtos = historial.stream().map(m -> {
            MensajeDTO dto = new MensajeDTO();
            dto.setContenido(m.getContenido());
            dto.setEmisorId(m.getEmisor().getId());
            dto.setReceptorId(m.getReceptor().getId());
            // Es vital enviar el nombre del emisor para que el frontend no muestre "Usuario ID"
            dto.setNombreEmisor(m.getEmisor().getUsername());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * TIEMPO REAL: Recibe y reenvía mensajes vía WebSocket (STOMP).
     */
    @MessageMapping("/chat.enviar")
    public void recibirMensaje(@Payload MensajeDTO mensajeDto, Principal principal) {
        Optional<Usuario> emisorOpt = usuarioRepository.findByUsername(principal.getName());

        if (emisorOpt.isPresent()) {
            Usuario emisor = emisorOpt.get();

            // Identificamos al receptor para obtener su username de sesión
            Usuario receptor = usuarioRepository.findById(mensajeDto.getReceptorId())
                    .orElseThrow(() -> new RuntimeException("Receptor no encontrado"));

            // 1. Persistencia: Guardar en la base de datos antes de enviar
            Mensaje mensajeGuardado = chatService.enviarMensaje(emisor.getId(), mensajeDto);

            // 2. Preparar el paquete de datos para el WebSocket
            MensajeDTO output = new MensajeDTO();
            output.setContenido(mensajeGuardado.getContenido());
            output.setEmisorId(emisor.getId());
            output.setReceptorId(receptor.getId());
            output.setConversacionId(mensajeDto.getConversacionId());
            // IMPORTANTE: Enviamos el nombre real para que aparezca en el feed de Herni
            output.setNombreEmisor(emisor.getUsername());

            System.out.println("[WS-SERVER] De " + emisor.getUsername() + " a " + receptor.getUsername() + ": " + output.getContenido());

            // 3. Envío segmentado por nombre de usuario (Spring Broker lo gestiona)
            messagingTemplate.convertAndSendToUser(
                    receptor.getUsername(),
                    "/queue/mensajes",
                    output
            );
        }
    }
}