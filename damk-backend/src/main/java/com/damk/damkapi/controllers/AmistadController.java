package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Amistad;
import com.damk.damkapi.repositories.AmistadRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/amistades")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AmistadController {

    @Autowired
    private AmistadRepository amistadRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping("/solicitar")
    public ResponseEntity<?> enviarSolicitud(@RequestBody Map<String, Long> payload) {
        Long emisorId = payload.get("emisorId");
        Long receptorId = payload.get("receptorId");

        Amistad nueva = new Amistad();
        nueva.setEmisor(usuarioRepository.findById(emisorId).get());
        nueva.setReceptor(usuarioRepository.findById(receptorId).get());
        nueva.setEstado("PENDIENTE");

        amistadRepository.save(nueva);
        return ResponseEntity.ok(Map.of("message", "Solicitud enviada"));
    }
}