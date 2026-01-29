package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.EstadoSolicitud;
import com.damk.damkapi.entities.SolicitudProfesor;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.SolicitudRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/solicitudes")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SolicitudController {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/crear")
    public ResponseEntity<?> crearSolicitud(@RequestBody SolicitudProfesor solicitud, Authentication authentication) {
        // 1. Validar si hay una sesión activa en el contexto de seguridad
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Sesión no válida o expirada"));
        }

        // 2. Buscar al usuario real en la DB usando la lógica que ya tienes en UsuarioController
        return buscarUsuarioPorAutenticacion(authentication).map(usuario -> {

            // 3. Vincular y forzar estados de seguridad
            solicitud.setUsuario(usuario);
            solicitud.setEstado(EstadoSolicitud.PENDIENTE); //
            solicitud.setFechaSolicitud(LocalDateTime.now());

            solicitudRepository.save(solicitud);
            return ResponseEntity.ok(Map.of("message", "Solicitud enviada con éxito."));

        }).orElse(ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado en la base de datos")));
    }

    /**
     * Mismo método de búsqueda que usas en UsuarioController para mantener la consistencia
     */
    private Optional<Usuario> buscarUsuarioPorAutenticacion(Authentication authentication) {
        String nombreTemp = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            String emailOauth = oauth2User.getAttribute("email");
            if (emailOauth != null) {
                nombreTemp = emailOauth;
            }
        }

        final String identificadorFinal = nombreTemp;
        return usuarioRepository.findByUsername(identificadorFinal)
                .or(() -> usuarioRepository.findByEmail(identificadorFinal));
    }
}