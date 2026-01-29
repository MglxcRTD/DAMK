package com.damk.damkapi.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversaciones")
@Data
public class Conversacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_uno_id")
    private Usuario usuarioUno;

    @ManyToOne
    @JoinColumn(name = "usuario_dos_id")
    private Usuario usuarioDos;

    private LocalDateTime ultimaActividad;
}
