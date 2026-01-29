package com.damk.damkapi.services;

import com.damk.damkapi.dtos.MensajeDTO;
import com.damk.damkapi.entities.Conversacion;
import com.damk.damkapi.entities.Mensaje;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.ConversacionRepository;
import com.damk.damkapi.repositories.MensajeRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ChatService {

    @Autowired
    private MensajeRepository mensajeRepository;
    @Autowired private ConversacionRepository conversacionRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    public Mensaje enviarMensaje(Long emisorId, MensajeDTO dto) {
        Usuario emisor = usuarioRepository.findById(emisorId).orElseThrow();
        Usuario receptor = usuarioRepository.findById(dto.getReceptorId()).orElseThrow();

        // 1. Buscar conversación entre ambos o crearla
        Conversacion conv = conversacionRepository
                .findByUsuarioUnoAndUsuarioDos(emisor, receptor)
                .or(() -> conversacionRepository.findByUsuarioUnoAndUsuarioDos(receptor, emisor))
                .orElseGet(() -> {
                    Conversacion nueva = new Conversacion();
                    nueva.setUsuarioUno(emisor);
                    nueva.setUsuarioDos(receptor);
                    nueva.setUltimaActividad(LocalDateTime.now());
                    return conversacionRepository.save(nueva);
                });

        // 2. Crear y guardar el mensaje
        Mensaje mensaje = new Mensaje();
        mensaje.setConversacion(conv);
        mensaje.setEmisor(emisor);
        mensaje.setContenido(dto.getContenido());
        mensaje.setFechaEnvio(LocalDateTime.now());

        conv.setUltimaActividad(LocalDateTime.now());
        conversacionRepository.save(conv);

        return mensajeRepository.save(mensaje);
    }
}
