package com.damk.damkapi.controllers;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
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
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private Cloudinary cloudinary;

    @GetMapping("/me")
    public ResponseEntity<?> obtenerUsuarioLogueado(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Sesión expirada o no válida"));
        }

        // Buscamos el usuario y mapeamos el resultado
        return buscarUsuarioPorAutenticacion(authentication)
                .map(usuario -> ResponseEntity.ok((Object) usuario)) // Casteo a Object para compatibilidad con <?>
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado")));
    }

    @PostMapping("/upload-pfp")
    public ResponseEntity<?> subirFotoPerfil(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Debes estar logueado"));
        }

        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "El archivo está vacío"));

        return buscarUsuarioPorAutenticacion(authentication)
                .map(usuario -> {
                    try {
                        // 1. Borrado seguro de la imagen anterior
                        if (usuario.getAvatarUrl() != null && usuario.getAvatarUrl().contains("cloudinary")) {
                            String publicId = extraerPublicId(usuario.getAvatarUrl());
                            if (publicId != null) {
                                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                            }
                        }

                        // 2. Subida a la carpeta solicitada
                        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                                ObjectUtils.asMap(
                                        "folder", "DAMK/avatares_perfil",
                                        "resource_type", "image"
                                ));

                        String urlImagenSubida = uploadResult.get("secure_url").toString();

                        // 3. Actualización de la entidad
                        usuario.setAvatarUrl(urlImagenSubida);
                        usuarioRepository.save(usuario);

                        return ResponseEntity.ok(Map.of(
                                "message", "Foto actualizada con éxito",
                                "avatarUrl", urlImagenSubida,
                                "user", usuario
                        ));
                    } catch (Exception e) {
                        return ResponseEntity.status(500).body(Map.of("error", "Fallo en Cloudinary: " + e.getMessage()));
                    }
                }).orElse(ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado")));
    }

    @PutMapping("/update")
    public ResponseEntity<?> actualizarPerfil(@RequestBody Usuario usuarioActualizado, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();

        return buscarUsuarioPorAutenticacion(authentication)
                .map(usuario -> {
                    usuario.setUsername(usuarioActualizado.getUsername());
                    usuario.setEmail(usuarioActualizado.getEmail());
                    if(usuarioActualizado.getAvatarUrl() != null) {
                        usuario.setAvatarUrl(usuarioActualizado.getAvatarUrl());
                    }
                    usuarioRepository.save(usuario);
                    return ResponseEntity.ok(Map.of("message", "Perfil actualizado correctamente", "user", usuario));
                }).orElse(ResponseEntity.notFound().build());
    }

    // --- NUEVAS FUNCIONALIDADES PARA CHAT Y BÚSQUEDA ---

    /**
     * Endpoint para buscar usuarios por nombre (LIKE %query%)
     * Utilizado por el modal de añadir amigos en el frontend.
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<Usuario>> buscarUsuarios(@RequestParam("query") String query) {
        // Buscamos usuarios cuyo nombre contenga la cadena enviada
        List<Usuario> resultados = usuarioRepository.findByUsernameContainingIgnoreCase(query);
        return ResponseEntity.ok(resultados);
    }

    /**
     * Endpoint para obtener todos los usuarios del sistema.
     * Utilizado por el Admin para el Directorio Global.
     */
    @GetMapping("/todos")
    public ResponseEntity<List<Usuario>> obtenerTodosLosUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return ResponseEntity.ok(usuarios);
    }

    /**
     * Lógica centralizada para encontrar al usuario en la DB.
     * Se usa una variable local 'final' para evitar errores en la lambda.
     */
    private Optional<Usuario> buscarUsuarioPorAutenticacion(Authentication authentication) {
        String nombreTemp = authentication.getName();

        if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
            String emailOauth = oauth2User.getAttribute("email");
            if (emailOauth != null) {
                nombreTemp = emailOauth;
            }
        }

        // Definimos el identificador como FINAL para que la lambda no de error
        final String identificadorFinal = nombreTemp;

        return usuarioRepository.findByUsername(identificadorFinal)
                .or(() -> usuarioRepository.findByEmail(identificadorFinal));
    }

    private String extraerPublicId(String url) {
        try {
            // Buscamos el inicio de la ruta que nos interesa en Cloudinary
            String folderPath = "DAMK/avatares_perfil/";
            int inicio = url.indexOf(folderPath);
            if (inicio == -1) return null;

            int fin = url.lastIndexOf(".");
            // El public_id para el borrado debe incluir las subcarpetas si se definieron así
            return url.substring(inicio, fin);
        } catch (Exception e) {
            return null;
        }
    }
}