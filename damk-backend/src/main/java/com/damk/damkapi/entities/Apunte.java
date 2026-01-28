package com.damk.damkapi.entities;

import com.damk.damkapi.entities.Usuario;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "apuntes")
@Data
public class Apunte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String asignatura;

    @Column(nullable = false)
    private String curso; // "Primero" o "Segundo"

    @Column(nullable = false, length = 500)
    private String urlCloudinary; // Aquí guardaremos el link seguro

    @Column(nullable = false)
    private String estado = "VERIFICADO"; // Lo ponemos verificado directo para pruebas

    private LocalDateTime fechaSubida = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario autor;
}