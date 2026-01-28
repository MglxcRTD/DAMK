package com.damk.damkapi.services; // Asegúrate de que este sea el nombre de tu carpeta de servicios

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Sube un archivo a Cloudinary organizándolo por carpetas: DAMK / Curso / Asignatura
     * @param file El archivo binario (PDF)
     * @param curso "Primero" o "Segundo"
     * @param asignatura Nombre de la asignatura (ej: Lenguaje de Marcas)
     * @return La URL segura (https) del archivo subido
     * @throws IOException Si ocurre un error al procesar el archivo
     */
    public String subirApunte(MultipartFile file, String curso, String asignatura) throws IOException {

        // 1. Definimos la ruta de la carpeta de forma dinámica según tu estructura
        // Reemplazamos espacios por guiones bajos para evitar problemas en la URL
        String folderPath = "DAMK/" + curso + "/" + asignatura.replace(" ", "_");

        // 2. Configuramos los parámetros de subida
        Map params = ObjectUtils.asMap(
                "folder", folderPath,
                "resource_type", "raw", // CRUCIAL: Obligatorio para PDFs en versión gratuita
                "use_filename", true,
                "unique_filename", true
        );

        // 3. Ejecutamos la subida a tu nube 'delpijtbh'
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

        // 4. Extraemos la URL segura (https) que guardaremos en MySQL
        return uploadResult.get("secure_url").toString();
    }
}