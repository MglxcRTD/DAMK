package com.damk.damkapi.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MensajeDTO {
    private String contenido;
    private Long receptorId;
    private Long emisorId; // <--- OBLIGATORIO PARA QUE EL RECEPTOR SEPA QUIÉN ENVÍA
    private Long conversacionId;
}