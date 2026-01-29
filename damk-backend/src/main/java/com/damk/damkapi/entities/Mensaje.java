package com.damk.damkapi.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "mensajes")
@Data
public class Mensaje {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conversacion_id")
    private Conversacion conversacion;

    @ManyToOne
    @JoinColumn(name = "emisor_id")
    private Usuario emisor;

    @Column(columnDefinition = "TEXT")
    private String contenido;

    private LocalDateTime fechaEnvio;
    private boolean leido = false;
}
