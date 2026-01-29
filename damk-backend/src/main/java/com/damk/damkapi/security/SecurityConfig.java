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
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .securityContext(context -> context
                        .securityContextRepository(securityContextRepository())
                )

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                )

                .authorizeHttpRequests(auth -> auth
                        // REGLA 1: Excepciones públicas
                        .requestMatchers(
                                "/api/auth/**",
                                "/login/**",
                                "/oauth2/**",
                                "/error",
                                "/api/apuntes/**",
                                "/ws-damk/**",
                                "/api/admin/verificaciones/quien-soy"
                        ).permitAll()

                        // REGLA 2: Rutas específicas de Usuarios y Amistad (Para evitar el 401)
                        // IMPORTANTE: .authenticated() permite a cualquier logueado (Admin o Alumno)
                        .requestMatchers("/api/usuarios/buscar").authenticated()
                        .requestMatchers("/api/usuarios/todos").authenticated()
                        .requestMatchers("/api/amistades/**").authenticated()

                        // REGLA 3: Restricciones de Perfil y Solicitudes
                        .requestMatchers("/api/solicitudes/**").authenticated()
                        .requestMatchers("/api/usuarios/me", "/api/usuarios/upload-pfp", "/api/usuarios/update").authenticated()

                        // REGLA 4: Restricciones por Rol de Administrador
                        // Usamos hasRole si el String en BD es "ADMIN" (Spring añade ROLE_ automáticamente)
                        // O usamos hasAuthority si prefieres el String exacto "ROLE_ADMIN"
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Cierre de seguridad
                        .anyRequest().authenticated()
                )

                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler((request, response, authentication) -> {
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
        configuration.setAllowedOrigins(List.of("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Cookie"
        ));

        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Set-Cookie"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}