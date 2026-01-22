package com.damk.damkapi.services;

import com.damk.damkapi.entities.AuthProvider;
import com.damk.damkapi.entities.Rol;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        if (email == null) {

            String login = oAuth2User.getAttribute("login");
            email = login + "@github.com";
            if(name == null){
                name = login;
            }
        }
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario nuevousuario = new Usuario();
            nuevousuario.setEmail(email);
            String baseName = (name != null ? name : email.split("@")[0]);
            nuevousuario.setPassword(null);
            nuevousuario.setRol(Rol.ALUMNO);
            String registrationID = userRequest.getClientRegistration().getRegistrationId().toUpperCase();
            if(usuarioRepository.existsByUsername(baseName)){
                nuevousuario.setUsername(baseName + "_" + registrationID);
            } else {
                nuevousuario.setUsername(baseName);
            }
            nuevousuario.setProvider(AuthProvider.valueOf(registrationID));
            nuevousuario.setProviderId(oAuth2User.getName());
            nuevousuario.setPuntosReputacion(0);
            usuarioRepository.save(nuevousuario);
            System.out.println("exito en el guardado...");
        } else {
            System.out.println("ya hubo un registro similar....");
        }

        return oAuth2User;
    }
}
