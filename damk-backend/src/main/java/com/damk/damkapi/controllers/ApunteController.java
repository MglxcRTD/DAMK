package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Apunte;
import com.damk.damkapi.repositories.ApunteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apuntes")
@CrossOrigin(origins = "http://localhost:4200")
public class ApunteController {

    @Autowired
    private ApunteRepository apunteRepository;

    @PostMapping("/subir")
    public Apunte crearApunte(@RequestBody Apunte apunte){
        apunte.setEstado("PENDIENTE");
        return apunteRepository.save(apunte);
    }

    @GetMapping("/{asignatura}")
    public List<Apunte> getApuntesVerificados(@PathVariable String asignatura){
        return apunteRepository.findByAsignaturaAndEstado(asignatura, "VERIFICADO");
    }
}
