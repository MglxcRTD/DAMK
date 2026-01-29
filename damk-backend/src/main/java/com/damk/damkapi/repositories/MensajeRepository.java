package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {
    // Recupera el historial de una conversación ordenado por fecha
    List<Mensaje> findByConversacionIdOrderByFechaEnvioAsc(Long conversacionId);
}
