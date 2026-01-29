package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.SolicitudProfesor;
import com.damk.damkapi.entities.EstadoSolicitud;
import com.damk.damkapi.entities.Usuario; // OBLIGATORIO para el método de búsqueda
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<SolicitudProfesor, Long> {

    // Para que el Admin vea la lista de solicitudes (PENDIENTE, ACEPTADA, etc.)
    List<SolicitudProfesor> findByEstado(EstadoSolicitud estado);

    // Para evitar duplicados: busca si el usuario tiene una solicitud en un estado concreto
    Optional<SolicitudProfesor> findByUsuarioIdAndEstado(Long usuarioId, EstadoSolicitud estado);


    Optional<SolicitudProfesor> findByUsuario(Usuario usuario);

    // También puedes usar este por si prefieres pasar solo el ID desde el Controller
    Optional<SolicitudProfesor> findByUsuarioId(Long usuarioId);
}