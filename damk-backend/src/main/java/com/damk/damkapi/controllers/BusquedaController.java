package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Apunte;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.ApunteRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/busqueda") // Ruta base: /api/busqueda
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class BusquedaController {

    @Autowired
    private ApunteRepository apunteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/global")
    public ResponseEntity<?> buscarTodo(@RequestParam("q") String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(Map.of("apuntes", new ArrayList<>(), "usuarios", new ArrayList<>()));
        }

        // 1. Buscamos apuntes por nombre (ej: "schema")
        List<Apunte> apuntes = apunteRepository.findByTituloContainingIgnoreCase(query);

        // 2. Buscamos usuarios por username (ej: "mglxc")
        List<Usuario> usuarios = usuarioRepository.findByUsernameContainingIgnoreCase(query);

        Map<String, Object> resultados = new HashMap<>();
        resultados.put("apuntes", apuntes);
        resultados.put("usuarios", usuarios);

        return ResponseEntity.ok(resultados);
    }
}