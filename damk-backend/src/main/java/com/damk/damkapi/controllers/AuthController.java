package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.services.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    @Autowired
    UsuarioService usuarioService;


    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@Valid @RequestBody Usuario usuario) {
        try {
            Usuario nuevousuario = usuarioService.registroManual(usuario);

            return ResponseEntity.ok(Map.of(
                    "message", "Usuario " + nuevousuario.getUsername() + " registrado correctamente",
                    "username", nuevousuario.getUsername()
            ));
        } catch(RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.get("username"),
                            loginRequest.get("password")
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            return ResponseEntity.ok(Map.of("message", "Login exitoso"));

        } catch (Exception e) {

            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña incorrectos"));
        }
    }
}