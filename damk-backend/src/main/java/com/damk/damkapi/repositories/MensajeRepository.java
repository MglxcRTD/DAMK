package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Mensaje;
import com.damk.damkapi.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
    // Recupera el historial de una conversación ordenado por fecha
    @Query("SELECT m FROM Mensaje m WHERE " +
            "(m.emisor = :u1 AND m.receptor = :u2) OR " +
            "(m.emisor = :u2 AND m.receptor = :u1) " +
            "ORDER BY m.fechaEnvio ASC")
    List<Mensaje> findChatHistory(@Param("u1") Usuario u1, @Param("u2") Usuario u2);
    List<Mensaje> findByConversacionIdOrderByFechaEnvioAsc(Long conversacionId);
}
