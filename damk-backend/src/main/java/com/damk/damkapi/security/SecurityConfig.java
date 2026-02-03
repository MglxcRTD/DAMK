package com.damk.damkapi.security;

import com.damk.damkapi.services.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Configuramos el CORS primero para que no bloquee las pre-flight requests (OPTIONS)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Deshabilitamos CSRF porque estamos en desarrollo y manejamos las sesiones manualmente
                .csrf(csrf -> csrf.disable())

                // Configuramos el repositorio de seguridad para que la sesión persista entre peticiones
                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository())
                )

                // Política de sesión: Siempre crear si no existe para mantener al usuario logueado
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                )

                .authorizeHttpRequests(auth -> auth
                        // REGLA 1: Rutas totalmente públicas
                        .requestMatchers(
                                "/api/auth/**",
                                "/login/**",
                                "/api/busqueda/**",
                                "/oauth2/**",
                                "/error",
                                "/api/apuntes/**",
                                "/ws-damk/**"
                        ).permitAll()

                        // REGLA 2: Rutas para usuarios autenticados (Cualquier ROL)
                        .requestMatchers("/api/usuarios/buscar").authenticated()
                        .requestMatchers("/api/usuarios/todos").authenticated()
                        .requestMatchers("/api/amistades/**").authenticated()
                        .requestMatchers("/api/solicitudes/crear").authenticated() // Aseguramos que esta ruta sea accesible
                        .requestMatchers("/api/solicitudes/me").authenticated()
                        .requestMatchers("/api/usuarios/me", "/api/usuarios/upload-pfp", "/api/usuarios/update").authenticated()
                        .requestMatchers("/api/usuarios/buscar").authenticated()
                        // REGLA 3: Rutas exclusivas para el Administrador
                        .requestMatchers("/api/solicitudes/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Cierre de seguridad total
                        .anyRequest().authenticated()
                )

                // Si no está autenticado, devolvemos 401 en lugar de redirigir a una página de login HTML
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                // Configuración de Login social (Google/GitHub)
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler((request, response, authentication) -> {
                            // Guardamos el contexto de seguridad manualmente en la sesión tras el éxito
                            securityContextRepository().saveContext(
                                    org.springframework.security.core.context.SecurityContextHolder.getContext(),
                                    request,
                                    response
                            );
                            response.sendRedirect("http://localhost:4200/home");
                        })
                );

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        // Este bean es vital para que Spring guarde la sesión en el lugar correcto (Atributos de request + Sesión HTTP)
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository()
        );
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // El origen de tu frontend en Angular
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));

        // Permitimos todos los métodos HTTP necesarios
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Cabeceras permitidas. Añadimos X-Requested-With que es común en peticiones AJAX
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Cookie"
        ));

        // CRÍTICO: Permitir el envío de Cookies de sesión desde el frontend
        configuration.setAllowCredentials(true);

        // Exponemos la cabecera Set-Cookie para que el navegador la procese correctamente
        configuration.setExposedHeaders(List.of("Set-Cookie"));

        // Tiempo de caché para la configuración CORS
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplicamos esta configuración a todas las rutas de la API
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}