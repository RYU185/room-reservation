package com.ryu.room_reservation.room.entity;

import com.ryu.room_reservation.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class Room extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private int capacity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> amenities;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    public void deactivate() {
        this.active = false;
    }

    public void update(String name, String location, int capacity, String description, List<String> amenities) {
        this.name = name;
        this.location = location;
        this.capacity = capacity;
        this.description = description;
        this.amenities = amenities;
    }
}
