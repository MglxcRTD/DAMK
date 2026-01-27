package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioLogueado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "No hay sesión activa"));
        }

        // Usamos una variable temporal para el cálculo
        String idTemp = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            String emailOauth = oauth2User.getAttribute("email");
            if (emailOauth != null) {
                idTemp = emailOauth;
            }
        }

        // Creamos una variable final para que el lambda no se queje
        final String identificadorFinal = idTemp;

        System.out.println("Buscando sesión para el identificador: " + identificadorFinal);

        return usuarioRepository.findByUsername(identificadorFinal)
                .map(ResponseEntity::ok)
                .orElseGet(() -> usuarioRepository.findByEmail(identificadorFinal)
                        .map(ResponseEntity::ok)
                        .orElseGet(() -> {
                            System.out.println("ERROR: Usuario no encontrado en BD para: " + identificadorFinal);
                            return ResponseEntity.status(404).build();
                        }));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPerfil(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/update")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Usuario usuarioActualizado, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        final String currentUsername = authentication.getName();
        return usuarioRepository.findByUsername(currentUsername)
                .map(usuario -> {
                    usuario.setUsername(usuarioActualizado.getUsername());
                    usuario.setEmail(usuarioActualizado.getEmail());
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok(Map.of("message", "Perfil actualizado correctamente", "user", usuario));
                }).orElse(ResponseEntity.notFound().build());
    }
}