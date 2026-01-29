// src/app/models/mensaje.dto.ts

export interface MensajeDTO {
    id?: number;              // <-- El ? lo hace opcional
    contenido: string;
    receptorId: number;
    conversacionId: number;
    emisorId?: number;        // También opcional para el envío
    fechaEnvio?: Date;
}