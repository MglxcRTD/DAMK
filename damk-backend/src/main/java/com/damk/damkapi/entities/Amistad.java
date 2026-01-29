package com.damk.damkapi.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "amistades")
@Data
public class Amistad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "emisor_id")
    private Usuario emisor;

    @ManyToOne
    @JoinColumn(name = "receptor_id")
    private Usuario receptor;

    private String estado; // "PENDIENTE", "ACEPTADA", "RECHAZADA"
    private LocalDateTime fechaSolicitud = LocalDateTime.now();
}