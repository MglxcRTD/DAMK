package com.damk.damkapi.services;

import com.damk.damkapi.entities.AuthProvider;
import com.damk.damkapi.entities.Rol;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. Cargamos el usuario básico desde el proveedor (Google/GitHub)
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. Extraemos los datos necesarios
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Manejo específico para GitHub si el email viene oculto/privado
        if (email == null) {
            String login = oAuth2User.getAttribute("login");
            email = (login != null ? login : oAuth2User.getName()) + "@github.com";
            if(name == null) name = login;
        }

        // 3. Buscamos al usuario en nuestra base de datos o lo creamos
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        Usuario usuario;

        if (usuarioOpt.isEmpty()) {
            usuario = new Usuario();
            usuario.setEmail(email);
            String baseName = (name != null ? name : email.split("@")[0]);
            usuario.setPassword(null);
            usuario.setRol(Rol.ALUMNO); // Rol por defecto inicial

            String registrationID = userRequest.getClientRegistration().getRegistrationId().toUpperCase();

            // Lógica para evitar duplicados de username
            if(usuarioRepository.existsByUsername(baseName)){
                usuario.setUsername(baseName + "_" + registrationID);
            } else {
                usuario.setUsername(baseName);
            }

            usuario.setProvider(AuthProvider.valueOf(registrationID));
            usuario.setProviderId(oAuth2User.getName());
            usuarioRepository.save(usuario);
        } else {
            usuario = usuarioOpt.get();
        }

        // 4. ¡VITAL!: Inyectamos el Rol con el prefijo ROLE_
        // Esto permite que @PreAuthorize("hasAuthority('ROLE_ADMIN')") funcione.
        String roleName = "ROLE_" + usuario.getRol().name();

        // 5. Devolvemos el usuario con el email como clave de identificación primaria ("email")
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(roleName)),
                oAuth2User.getAttributes(),
                "email" // <--- Clave para que SolicitudController encuentre al usuario por email
        );
    }
}