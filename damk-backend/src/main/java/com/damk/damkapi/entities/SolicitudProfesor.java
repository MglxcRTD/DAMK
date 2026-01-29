package com.damk.damkapi.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class SolicitudProfesor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario; // Quién solicita

    private String nombre;
    private String apellidos;
    private String centroTrabajo;
    private String linkedIn;

    @Enumerated(EnumType.STRING)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE; // PENDIENTE, ACEPTADA, RECHAZADA

    private String mensajeAdmin; // Para explicar por qué se rechazó
    private LocalDateTime fechaSolicitud = LocalDateTime.now();
}

