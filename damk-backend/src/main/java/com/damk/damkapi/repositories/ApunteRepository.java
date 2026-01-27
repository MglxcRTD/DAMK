package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Apunte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApunteRepository extends JpaRepository<Apunte, Long> {
    List<Apunte> findByAsignaturaAndEstado(String asignatura, String estado);
    List<Apunte> findByEstado(String estado);
}
