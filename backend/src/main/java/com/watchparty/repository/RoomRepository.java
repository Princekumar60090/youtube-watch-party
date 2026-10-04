package com.watchparty.repository;

import com.watchparty.model.document.Room;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {

    Optional<Room> findByRoomCodeIgnoreCaseAndActiveTrue(String roomCode);

    Optional<Room> findByIdAndActiveTrue(String id);

    boolean existsByRoomCodeIgnoreCase(String roomCode);
}
