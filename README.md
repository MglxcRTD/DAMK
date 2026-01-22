# DAMK - Plataforma de Apuntes Colaborativos 🦆

**DAMK** es una aplicación web diseñada para centralizar y mejorar el intercambio de material académico entre estudiantes del ciclo formativo de **Desarrollo de Aplicaciones Multiplataforma (DAM)**. El proyecto se centra en la calidad del contenido mediante un sistema de verificación por parte del profesorado y recompensas por gamificación.

## 🚀 Estado del Proyecto
Actualmente, el proyecto se encuentra en su fase inicial de desarrollo, con las siguientes funcionalidades implementadas:

* **Sistema de Acceso:** Registro y Login de usuarios con validaciones en tiempo real.
* **Interfaz Principal (Home):** Diseño responsive con navegación lateral, buscador y grid de asignaturas.
* **Módulo de Asignaturas:** Clasificación por cursos (1º y 2º) y áreas temáticas (Sistemas, Programación, BD, etc.).
* **Estructura de Seguridad:** Control previo de archivos (tamaño y extensión) para la subida de apuntes.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** [Angular](https://angular.io/) (v17+) con SCSS.
* **Estilos:** Material Design Icons y Flexbox/Grid personalizado.
* **Backend:** Java 17 con [Spring Boot](https://spring.io/projects/spring-boot) (en desarrollo).
* **Persistencia y Almacenamiento:** [Firebase](https://firebase.google.com/) (Auth & Storage).

## 📁 Estructura del Repositorio

* `/src/app`: Componentes de la lógica de Angular (Login, Register, Home).
* `/src/assets`: Recursos estáticos e imágenes del proyecto (Iconos DAMK).
* `/styles`: Configuración global de estilos y variables de tema (Amarillo Pato).

## 🔧 Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/damk.git](https://github.com/tu-usuario/damk.git)
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Ejecutar en local:**
    ```bash
    ng serve
    ```
    Navegar a `http://localhost:4200/`.

## 📌 Próximos Pasos
* Implementación de la subida efectiva a **Firebase Storage**.
* Panel de ajustes de usuario (Perfil).
* Lógica de verificación de apuntes para el rol "Profesor".

---
*Desarrollado como proyecto de fin de ciclo - DAM.*
