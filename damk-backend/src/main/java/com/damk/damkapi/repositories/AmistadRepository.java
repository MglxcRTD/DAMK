package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Amistad;
import com.damk.damkapi.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmistadRepository extends JpaRepository<Amistad, Long> {

    // Para buscar solicitudes pendientes de un usuario específico (el receptor)
    List<Amistad> findByReceptorAndEstado(Usuario receptor, String estado);

    // Para obtener todos los amigos aceptados de un usuario (ya sea como emisor o receptor)
    List<Amistad> findByEmisorAndEstadoOrReceptorAndEstado(Usuario emisor, String estadoE, Usuario receptor, String estadoR);

    // Para evitar duplicados: comprobar si ya existe una solicitud entre dos personas
    Optional<Amistad> findByEmisorAndReceptor(Usuario emisor, Usuario receptor);
}