package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Conversacion;
import com.damk.damkapi.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversacionRepository extends JpaRepository<Conversacion, Long> {
    // Busca conversaciones donde el usuario sea participante 1 o participante 2
    List<Conversacion> findByUsuarioUnoOrUsuarioDos(Usuario u1, Usuario u2);

    // Para no duplicar chats entre las mismas dos personas
    Optional<Conversacion> findByUsuarioUnoAndUsuarioDos(Usuario u1, Usuario u2);

    // Obtiene conversaciones activas para el feed lateral ordenadas por fecha
    List<Conversacion> findByUsuarioUnoOrUsuarioDosOrderByUltimaActividadDesc(Usuario u1, Usuario u2);
}
