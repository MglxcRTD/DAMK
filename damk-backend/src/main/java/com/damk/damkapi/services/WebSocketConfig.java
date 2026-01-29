package com.damk.damkapi.services;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita un broker de mensajes sencillo para enviar datos al cliente
        config.enableSimpleBroker("/topic", "/queue");
        // Prefijo para los mensajes que el cliente envía al servidor
        config.setApplicationDestinationPrefixes("/app");
        // Para mensajes privados (usuario a usuario)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Punto de conexión para el cliente Angular (SockJS para compatibilidad)
        registry.addEndpoint("/ws-damk")
                .setAllowedOriginPatterns("http://localhost:4200")
                .withSockJS();
    }
}
