package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.EstadoSolicitud;
import com.damk.damkapi.entities.Rol;
import com.damk.damkapi.entities.SolicitudProfesor;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.SolicitudRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/verificaciones")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AdminController {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Lista todas las solicitudes pendientes para el administrador.
     * Solo accesible por usuarios con ROL_ADMIN.
     */
    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SolicitudProfesor>> obtenerSolicitudesPendientes() {
        List<SolicitudProfesor> pendientes = solicitudRepository.findByEstado(EstadoSolicitud.PENDIENTE);
        return ResponseEntity.ok(pendientes);
    }

    /**
     * Procesa la aceptación o rechazo de una solicitud.
     * Si se acepta, el rol del usuario cambia automáticamente a PROFESOR.
     */
    @PostMapping("/{id}/decidir")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> procesarSolicitud(
            @PathVariable Long id,
            @RequestBody Map<String, String> decision) {

        return solicitudRepository.findById(id).map(solicitud -> {
            String nuevoEstado = decision.get("estado");
            String mensaje = decision.get("mensaje");

            if ("ACEPTADA".equalsIgnoreCase(nuevoEstado)) {
                // 1. Actualizar estado de la solicitud
                solicitud.setEstado(EstadoSolicitud.ACEPTADA);

                // 2. Cambiar el Rol del Usuario (Usando el Enum Rol)
                Usuario usuario = solicitud.getUsuario();
                usuario.setRol(Rol.PROFESOR);
                usuarioRepository.save(usuario);

                solicitud.setMensajeAdmin("Solicitud aprobada: Bienvenido al equipo docente.");
            } else {
                // 3. Caso de Rechazo
                solicitud.setEstado(EstadoSolicitud.RECHAZADA);
                solicitud.setMensajeAdmin(mensaje != null ? mensaje : "Solicitud denegada por el administrador.");
            }

            solicitudRepository.save(solicitud);
            return ResponseEntity.ok(Map.of(
                    "message", "La solicitud ha sido " + nuevoEstado.toLowerCase(),
                    "rolActual", solicitud.getUsuario().getRol()
            ));

        }).orElse(ResponseEntity.notFound().build());
    }
}