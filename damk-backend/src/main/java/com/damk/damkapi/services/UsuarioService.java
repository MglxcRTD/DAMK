package com.damk.damkapi.services;

import com.damk.damkapi.entities.AuthProvider;
import com.damk.damkapi.entities.Rol;
import com.damk.damkapi.entities.Usuario;
import com.damk.damkapi.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    public Usuario registroManual(Usuario usuario){

        if(usuarioRepository.existsByUsername(usuario.getUsername())){
            throw new RuntimeException("El usuario ya está registrado");
        }


        String password_encriptada = passwordEncoder.encode(usuario.getPassword());
        usuario.setPassword(password_encriptada);


        usuario.setProvider(AuthProvider.LOCAL);


        if (usuario.getRol() == null) {
            usuario.setRol(Rol.ALUMNO);
        }



        return usuarioRepository.save(usuario);
    }
}