package com.manacommunity.sports.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SportsWebCorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Value("${app.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String allowedMethods;

    @Value("${app.cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${app.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${app.cors.max-age:3600}")
    private long maxAge;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toArray(String[]::new);

        String[] methods = Arrays.stream(allowedMethods.split(","))
                .map(String::trim)
                .toArray(String[]::new);

        registry.addMapping("/api/**")
                .allowedOriginPatterns(origins)
                .allowedMethods(methods)
                .allowedHeaders(allowedHeaders.equals("*") ? new String[]{"*"} : allowedHeaders.split(","))
                .allowCredentials(allowCredentials)
                .maxAge(maxAge);
    }

    /**
     * Optional filter bean for Spring Security filter chain integration
     */
    @Bean
    public CorsFilter sportsCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        List<String> originsList = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();

        config.setAllowedOriginPatterns(originsList);
        config.setAllowedMethods(Arrays.stream(allowedMethods.split(",")).map(String::trim).toList());
        config.setAllowedHeaders(allowedHeaders.equals("*") ? List.of("*") : Arrays.asList(allowedHeaders.split(",")));
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(maxAge);

        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
