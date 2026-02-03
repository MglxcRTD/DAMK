package com.damk.damkapi.repositories;

import com.damk.damkapi.entities.Rol;
import com.damk.damkapi.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<Usuario> findByUsernameContainingIgnoreCase(String username);
    List<Usuario> findByUsernameContainingIgnoreCaseAndRol(String username, Rol rol);

}
