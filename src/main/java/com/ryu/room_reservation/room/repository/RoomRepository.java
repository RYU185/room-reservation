package com.ryu.room_reservation.room.repository;

import com.ryu.room_reservation.room.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {

    Page<Room> findByActiveTrue(Pageable pageable);

    boolean existsByNameAndActiveTrue(String name);
}
