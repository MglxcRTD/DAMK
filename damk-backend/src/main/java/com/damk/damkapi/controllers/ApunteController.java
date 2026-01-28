package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Apunte;
import com.damk.damkapi.repositories.ApunteRepository;
import com.damk.damkapi.services.CloudinaryService; // Asegúrate de que este sea tu paquete de servicios
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/apuntes")
@CrossOrigin(origins = "http://localhost:4200")
public class ApunteController {

    @Autowired
    private ApunteRepository apunteRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/subir")
    public ResponseEntity<Apunte> crearApunte(
            @RequestParam("file") MultipartFile file,
            @RequestParam("titulo") String titulo,
            @RequestParam("asignatura") String asignatura,
            @RequestParam("curso") String curso,
            @RequestParam("usuarioId") Long usuarioId) {

        try {
            // 1. Subimos a Cloudinary con la ruta DAMK/Curso/Asignatura
            // El servicio usará resource_type: "raw" para evitar errores de visualización
            String url = cloudinaryService.subirApunte(file, curso, asignatura);

            // 2. Creamos el objeto para guardar en MySQL
            Apunte nuevoApunte = new Apunte();
            nuevoApunte.setTitulo(titulo);
            nuevoApunte.setAsignatura(asignatura);
            nuevoApunte.setCurso(curso);
            nuevoApunte.setUrlCloudinary(url);
            nuevoApunte.setEstado("VERIFICADO");

            // Nota: Aquí podrías inyectar UsuarioRepository para asociar el autor real

            return ResponseEntity.ok(apunteRepository.save(nuevoApunte));

        } catch (Exception e) {
            e.printStackTrace(); // Útil para ver errores en la consola de Spring
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{asignatura}")
    public List<Apunte> getApuntesVerificados(@PathVariable String asignatura){
        // Busca los apuntes de la asignatura (ej: Lenguaje de Marcas) que ya estén validados
        return apunteRepository.findByAsignaturaAndEstado(asignatura, "VERIFICADO");
    }
}