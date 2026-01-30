package com.damk.damkapi.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudCrearDTO {
    private String nombre;
    private String apellidos;
    private String centroTrabajo;
    private String linkedIn;
}