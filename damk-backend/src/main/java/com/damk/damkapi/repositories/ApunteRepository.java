package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Apunte;
import com.damk.damkapi.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApunteRepository extends JpaRepository<Apunte, Long> {
    List<Apunte> findByAsignaturaAndEstado(String asignatura, String estado);
    List<Apunte> findByEstado(String estado);
    List<Apunte> findByTituloContainingIgnoreCase(String palabra);
    List<Apunte> findByAutor(Usuario autor);
}
