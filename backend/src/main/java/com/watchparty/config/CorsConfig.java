package com.watchparty.config;

import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class CorsConfig {

    private final AppProperties appProperties;

    public CorsConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = appProperties.getCors().resolvedAllowedOrigins();
        // Patterns support exact origins and wildcards (e.g. https://*.vercel.app).
        // Allowed with credentials — unlike setAllowedOrigins("*").
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(appProperties.getCors().resolvedAllowedMethods());
        config.addAllowedHeader(appProperties.getCors().getAllowedHeaders());
        config.setAllowCredentials(appProperties.getCors().isAllowCredentials());
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
