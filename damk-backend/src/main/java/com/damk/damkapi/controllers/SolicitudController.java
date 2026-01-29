package com.damk.damkapi.controllers;

import com.damk.damkapi.dtos.MensajeDTO;
import com.damk.damkapi.entities.*;
import com.damk.damkapi.repositories.*;
import com.damk.damkapi.services.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
// Cambiamos el RequestMapping a uno más general para que cubra tanto Admin como User
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SolicitudController {

    @Autowired private SolicitudRepository solicitudRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ChatService chatService;

    // --- NUEVO MÉTODO: SOLUCIÓN AL ERROR 404 (/api/solicitudes/me) ---
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

    // --- MÉTODOS DE ADMINISTRACIÓN (Ruta ajustada para colgar de /api/solicitudes) ---

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
                m.setContenido(motivo != null ? motivo : "Tu solicitud ha sido revisada.");
                chatService.enviarMensaje(admin.getId(), m);
            });
        } catch (Exception e) { System.err.println("WS Error: " + e.getMessage()); }

        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    // MÉTODO DE TEST MANTENIDO
    @GetMapping("/admin/quien-soy")
    public ResponseEntity<?> testSesion(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.ok(Map.of("status", "No hay objeto Authentication (Sesión no detectada)"));
        }
        return ResponseEntity.ok(Map.of(
                "nombre", auth.getName(),
                "autoridades", auth.getAuthorities().stream().map(Object::toString).collect(Collectors.toList()),
                "autenticado", auth.isAuthenticated()
        ));
    }

    // Lógica de búsqueda de usuario centralizada con corrección de variable final
    private Optional<Usuario> buscarUsuarioPorAutenticacion(Authentication authentication) {
        if (authentication == null) return Optional.empty();

        String tempIdentificador = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            String emailAttr = oAuth2User.getAttribute("email");
            if (emailAttr != null) {
                tempIdentificador = emailAttr;
            }
        }

        // CORRECCIÓN: Creamos una variable final que reciba el valor final antes de entrar en la lambda
        final String identificadorFinal = tempIdentificador;

        return usuarioRepository.findByUsername(identificadorFinal)
                .or(() -> usuarioRepository.findByEmail(identificadorFinal));
    }
}