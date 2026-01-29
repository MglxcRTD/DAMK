package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.SolicitudProfesor;
import com.damk.damkapi.entities.EstadoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<SolicitudProfesor, Long> {

    // Para que el Admin vea la lista de pendientes
    List<SolicitudProfesor> findByEstado(EstadoSolicitud estado);

    // Para evitar que un usuario mande 20 solicitudes a la vez
    Optional<SolicitudProfesor> findByUsuarioIdAndEstado(Long usuarioId, EstadoSolicitud estado);
}