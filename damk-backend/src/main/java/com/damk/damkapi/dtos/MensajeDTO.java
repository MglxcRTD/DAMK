package com.damk.damkapi.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MensajeDTO {
    private String contenido;
    private Long receptorId;
    private Long emisorId;
    private Long conversacionId;
    private String nombreEmisor; // <--- CLAVE para el Feed lateral
    private LocalDateTime timestamp;
}