package com.damk.damkapi.controllers;

import com.damk.damkapi.dtos.MensajeDTO;
import com.damk.damkapi.dtos.SolicitudCrearDTO;
import com.damk.damkapi.entities.*;
import com.damk.damkapi.repositories.*;
import com.damk.damkapi.services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SolicitudController {

    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ChatService chatService;

    /**
     * MÉTODO ACTUALIZADO: Recepción mediante Map para evitar errores de deserialización (Bad Request 400).
     * Extraemos los datos del mapa y construimos la entidad SolicitudProfesor vinculada al usuario activo.
     * Se usa Object en el Map para mayor flexibilidad con valores nulos o vacíos.
     */
    @PostMapping("/crear")
    public ResponseEntity<?> crearSolicitud(@RequestBody Map<String, Object> payload, Authentication authentication) {
        return buscarUsuarioPorAutenticacion(authentication)
                .map(usuario -> {
                    // 1. Verificación de existencia previa
                    if (solicitudRepository.findByUsuario(usuario).isPresent()) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Ya tienes una solicitud pendiente"));
                    }

                    // 2. Construcción manual de la entidad desde el payload
                    // Usamos String.valueOf para asegurar que convertimos los datos del JSON correctamente
                    SolicitudProfesor nueva = new SolicitudProfesor();
                    nueva.setUsuario(usuario);
                    nueva.setNombre(String.valueOf(payload.get("nombre")));
                    nueva.setApellidos(String.valueOf(payload.get("apellidos")));
                    nueva.setCentroTrabajo(String.valueOf(payload.get("centroTrabajo")));

                    // Manejo de LinkedIn (puede ser opcional)
                    Object linkedInVal = payload.get("linkedIn");
                    nueva.setLinkedIn(linkedInVal != null ? String.valueOf(linkedInVal) : "");

                    nueva.setEstado(EstadoSolicitud.PENDIENTE);
                    nueva.setFechaSolicitud(LocalDateTime.now());

                    // 3. Persistencia en base de datos
                    solicitudRepository.save(nueva);

                    System.out.println("[SOLICITUD] Creada con éxito para el usuario: " + usuario.getUsername());

                    return ResponseEntity.ok(Map.of("message", "Solicitud creada con éxito"));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "No autenticado")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> obtenerMiEstadoSolicitud(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));
        }

        return buscarUsuarioPorAutenticacion(authentication)
                .map(usuario -> {
                    Optional<SolicitudProfesor> solicitud = solicitudRepository.findByUsuario(usuario);
                    if (solicitud.isEmpty()) {
                        return ResponseEntity.noContent().build();
                    }
                    return ResponseEntity.ok(solicitud.get());
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado")));
    }

    @GetMapping("/admin/pendientes")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<List<SolicitudProfesor>> obtenerSolicitudesPendientes() {
        return ResponseEntity.ok(solicitudRepository.findByEstado(EstadoSolicitud.PENDIENTE));
    }

    @PostMapping("/admin/{id}/decidir")
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<?> resolverSolicitud(@PathVariable Long id, @RequestBody Map<String, String> decision, Authentication authentication) {
        SolicitudProfesor solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        EstadoSolicitud nuevoEstado = EstadoSolicitud.valueOf(decision.get("estado"));
        String motivo = decision.get("mensaje");
        Usuario usuarioAlumno = solicitud.getUsuario();

        if (EstadoSolicitud.ACEPTADA.equals(nuevoEstado)) {
            usuarioAlumno.setRol(Rol.PROFESOR);
            usuarioAlumno.setVerificado(true);
        }

        solicitud.setEstado(nuevoEstado);
        solicitud.setMensajeAdmin(motivo);
        usuarioRepository.save(usuarioAlumno);
        solicitudRepository.save(solicitud);

        try {
            buscarUsuarioPorAutenticacion(authentication).ifPresent(admin -> {
                MensajeDTO m = new MensajeDTO();
                m.setReceptorId(usuarioAlumno.getId());
                m.setEmisorId(admin.getId());
                m.setContenido(motivo != null ? motivo : "Tu solicitud ha sido revisada.");
                chatService.enviarMensaje(admin.getId(), m);
            });
        } catch (Exception e) { System.err.println("WS Error: " + e.getMessage()); }

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @GetMapping("/admin/quien-soy")
    public ResponseEntity<?> testSesion(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.ok(Map.of("status", "No hay objeto Authentication"));
        }
        return ResponseEntity.ok(Map.of(
                "nombre", auth.getName(),
                "autoridades", auth.getAuthorities().stream().map(Object::toString).collect(Collectors.toList()),
                "autenticado", auth.isAuthenticated()
        ));
    }

    private Optional<Usuario> buscarUsuarioPorAutenticacion(Authentication authentication) {
        if (authentication == null) return Optional.empty();

        String tempIdentificador = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            String emailAttr = oAuth2User.getAttribute("email");
            if (emailAttr != null) {
                tempIdentificador = emailAttr;
            }
        }

        final String identificadorFinal = tempIdentificador;

        return usuarioRepository.findByUsername(identificadorFinal)
                .or(() -> usuarioRepository.findByEmail(identificadorFinal));
    }
}