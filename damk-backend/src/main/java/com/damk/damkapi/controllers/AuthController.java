package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import com.damk.damkapi.services.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    @Autowired
    UsuarioService usuarioService;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    // Repositorio necesario para persistir la sesión en la cookie JSESSIONID
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@Valid @RequestBody Usuario usuario) {
        try {
            Usuario nuevousuario = usuarioService.registroManual(usuario);
            return ResponseEntity.ok(Map.of(
                    "message", "Usuario " + nuevousuario.getUsername() + " registrado correctamente",
                    "user", nuevousuario
            ));
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        try {
            // 1. Autenticar credenciales
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.get("username"),
                            loginRequest.get("password")
                    )
            );

            // 2. Establecer en el contexto de seguridad
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. PERSISTENCIA DE LA SESIÓN: Esto genera/vincula la cookie JSESSIONID
            // Sin esto, la sesión se pierde inmediatamente después del return
            securityContextRepository.saveContext(SecurityContextHolder.getContext(), request, response);

            // 4. Obtener datos del usuario para el frontend
            Usuario usuario = usuarioRepository.findByUsername(loginRequest.get("username"))
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado en base de datos"));

            return ResponseEntity.ok(Map.of(
                    "message", "Login exitoso",
                    "user", usuario
            ));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña incorrectos"));
        }
    }
}