package com.ryu.room_reservation.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ryu.room_reservation.admin.dto.RoomStatsResponse;
import com.ryu.room_reservation.reservation.dto.ReservationResponse;
import com.ryu.room_reservation.room.dto.RoomResponse;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .disableCachingNullValues();

        return RedisCacheManager.builder(factory)
                .cacheDefaults(base.entryTtl(Duration.ofMinutes(5)))
                .withInitialCacheConfigurations(Map.of(
                        "room", base.entryTtl(Duration.ofMinutes(10))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                                        new Jackson2JsonRedisSerializer<>(objectMapper, RoomResponse.class))),
                        "calendar", base.entryTtl(Duration.ofMinutes(2))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                                        new Jackson2JsonRedisSerializer<>(objectMapper,
                                                objectMapper.getTypeFactory().constructCollectionType(List.class, ReservationResponse.class)))),
                        "roomStats", base.entryTtl(Duration.ofMinutes(10))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                                        new Jackson2JsonRedisSerializer<>(objectMapper,
                                                objectMapper.getTypeFactory().constructCollectionType(List.class, RoomStatsResponse.class))))
                ))
                .build();
    }
}
