package com.damk.damkapi.controllers;

import com.damk.damkapi.entities.Apunte;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.ApunteRepository;
import com.damk.damkapi.repositories.UsuarioRepository;
import com.damk.damkapi.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/apuntes")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ApunteController {

    @Autowired
    private ApunteRepository apunteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/subir")
    public ResponseEntity<Apunte> crearApunte(
            @RequestParam("file") MultipartFile file,
            @RequestParam("titulo") String titulo,
            @RequestParam("asignatura") String asignatura,
            @RequestParam("curso") String curso,
            Authentication authentication) {

        try {
            // 1. Buscamos al usuario que está logueado actualmente usando el helper corregido
            Usuario autor = buscarUsuarioPorAutenticacion(authentication)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // 2. Subimos a Cloudinary
            String url = cloudinaryService.subirApunte(file, curso, asignatura);

            // 3. Creamos el objeto con el AUTOR REAL
            Apunte nuevoApunte = new Apunte();
            nuevoApunte.setTitulo(titulo);
            nuevoApunte.setAsignatura(asignatura);
            nuevoApunte.setCurso(curso);
            nuevoApunte.setUrlCloudinary(url);
            nuevoApunte.setAutor(autor);

            // Lógica de estado según rol
            if (autor.getRol().name().equals("PROFESOR") || autor.getRol().name().equals("ADMIN")) {
                nuevoApunte.setEstado("VERIFICADO");
            } else {
                nuevoApunte.setEstado("PENDIENTE");
            }

            return ResponseEntity.ok(apunteRepository.save(nuevoApunte));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{asignatura}")
    public List<Apunte> getApuntesVerificados(@PathVariable String asignatura){
        return apunteRepository.findByAsignaturaAndEstado(asignatura, "VERIFICADO");
    }

    // --- MÉTODOS PARA "MIS APUNTES" ---

    @GetMapping("/mis-subidos")
    public ResponseEntity<List<Apunte>> getMisApuntesSubidos(Authentication authentication) {
        Optional<Usuario> usuarioOpt = buscarUsuarioPorAutenticacion(authentication);

        if (usuarioOpt.isPresent()) {
            List<Apunte> misApuntes = apunteRepository.findByAutor(usuarioOpt.get());
            return ResponseEntity.ok(misApuntes);
        } else {
            return ResponseEntity.status(401).build();
        }
    }

    // --- MÉTODOS PARA PROFESORES (VALIDACIÓN) ---

    @GetMapping("/pendientes")
    public ResponseEntity<List<Apunte>> getApuntesPendientes() {
        List<Apunte> pendientes = apunteRepository.findByEstado("PENDIENTE");
        return ResponseEntity.ok(pendientes);
    }

    @PutMapping("/{id}/validar")
    public ResponseEntity<?> validarApunte(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Apunte> apunteOpt = apunteRepository.findById(id);

        if (apunteOpt.isPresent()) {
            Apunte apunte = apunteOpt.get();
            apunte.setEstado(body.get("estado"));
            apunteRepository.save(apunte);
            return ResponseEntity.ok(Map.of("message", "Estado actualizado"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // --- LÓGICA DE APOYO (CORREGIDA PARA LAMBDAS) ---

    private Optional<Usuario> buscarUsuarioPorAutenticacion(Authentication authentication) {
        if (authentication == null) return Optional.empty();

        String idTemp = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null) idTemp = email;
        }

        // Creamos la variable final/effectively final para que la lambda no falle
        final String idFinal = idTemp;

        return usuarioRepository.findByUsername(idFinal)
                .or(() -> usuarioRepository.findByEmail(idFinal));
    }
}