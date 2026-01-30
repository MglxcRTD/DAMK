package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Amistad;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.AmistadRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/amistades")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AmistadController {

    @Autowired
    private AmistadRepository amistadRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/solicitar")
    public ResponseEntity<?> enviarSolicitud(@RequestBody Map<String, Long> payload) {
        Long emisorId = payload.get("emisorId");
        Long receptorId = payload.get("receptorId");

        Amistad nueva = new Amistad();
        // Buscamos los objetos Usuario completos para la relación
        nueva.setEmisor(usuarioRepository.findById(emisorId).get());
        nueva.setReceptor(usuarioRepository.findById(receptorId).get());
        nueva.setEstado("PENDIENTE");

        amistadRepository.save(nueva);
        return ResponseEntity.ok(Map.of("message", "Solicitud enviada"));
    }

    @PostMapping("/aceptar/{id}")
    public ResponseEntity<?> aceptarSolicitud(@PathVariable Long id) {
        Amistad amistad = amistadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        // Al pasar a ACEPTADA, el chat ya podrá filtrar a estos usuarios como "amigos"
        amistad.setEstado("ACEPTADA");
        amistadRepository.save(amistad);

        return ResponseEntity.ok(Map.of("message", "Ahora sois amigos"));
    }

    /**
     * Obtiene las solicitudes que el usuario tiene pendientes de aceptar.
     * Corregido para usar el repositorio que definiste.
     */
    @GetMapping("/pendientes/{usuarioId}")
    public ResponseEntity<?> obtenerPendientes(@PathVariable Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Amistad> pendientes = amistadRepository.findByReceptorAndEstado(usuario, "PENDIENTE");
        return ResponseEntity.ok(pendientes);
    }

    /**
     * Obtiene la lista de amigos (amistades aceptadas) para cargar en el panel de chat.
     */
    @GetMapping("/mis-amigos/{usuarioId}")
    public ResponseEntity<?> obtenerMisAmigos(@PathVariable Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Buscamos donde el usuario sea emisor o receptor y el estado sea ACEPTADA
        List<Amistad> amigos = amistadRepository.findByEmisorAndEstadoOrReceptorAndEstado(
                usuario, "ACEPTADA", usuario, "ACEPTADA");

        return ResponseEntity.ok(amigos);
    }
}