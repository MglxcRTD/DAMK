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
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ChatService {

    @Autowired private MensajeRepository mensajeRepository;
    @Autowired private ConversacionRepository conversacionRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    /**
     * Busca todos los usuarios con los que el usuario principal tiene chats activos.
     */
    public List<Usuario> obtenerContactosRecientes(Usuario usuario) {
        // Buscamos todas las conversaciones donde el usuario sea participe
        List<Conversacion> conversaciones = conversacionRepository
                .findByUsuarioUnoOrUsuarioDosOrderByUltimaActividadDesc(usuario, usuario);

        // Extraemos al "otro" usuario de cada conversación
        return conversaciones.stream().map(conv -> {
            if (conv.getUsuarioUno().getId().equals(usuario.getId())) {
                return conv.getUsuarioDos();
            } else {
                return conv.getUsuarioUno();
            }
        }).collect(Collectors.toList());
    }

    public Mensaje enviarMensaje(Long emisorId, MensajeDTO dto) {
        Usuario emisor = usuarioRepository.findById(emisorId).orElseThrow();
        Usuario receptor = usuarioRepository.findById(dto.getReceptorId()).orElseThrow();

        // Buscar conversación existente o crear una nueva (A <-> B o B <-> A)
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

        Mensaje mensaje = new Mensaje();
        mensaje.setConversacion(conv);
        mensaje.setEmisor(emisor);
        mensaje.setReceptor(receptor); // Aseguramos que se guarde la referencia del receptor
        mensaje.setContenido(dto.getContenido());
        mensaje.setFechaEnvio(LocalDateTime.now());

        conv.setUltimaActividad(LocalDateTime.now());
        conversacionRepository.save(conv);

        return mensajeRepository.save(mensaje);
    }
}