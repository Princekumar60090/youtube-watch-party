package com.watchparty.service;

import com.watchparty.dto.request.CreateRoomRequest;
import com.watchparty.dto.request.JoinRoomByCodeRequest;
import com.watchparty.dto.request.JoinRoomRequest;
import com.watchparty.dto.response.RoomResponse;
import com.watchparty.dto.response.RoomSessionResponse;
import com.watchparty.exception.BadRequestException;
import com.watchparty.exception.ConflictException;
import com.watchparty.exception.ResourceNotFoundException;
import com.watchparty.model.document.Participant;
import com.watchparty.model.document.Room;
import com.watchparty.model.enums.RoomRole;
import com.watchparty.repository.RoomRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomService {

    public static final int MAX_PARTICIPANTS_PER_ROOM = 50;
    private static final int MAX_CODE_ATTEMPTS = 8;
    private static final String DEFAULT_PLAY_STATE = "paused";

    private final RoomRepository roomRepository;
    private final RoomCodeGenerator roomCodeGenerator;
    private final RoomMapper roomMapper;

    public RoomService(
            RoomRepository roomRepository,
            RoomCodeGenerator roomCodeGenerator,
            RoomMapper roomMapper
    ) {
        this.roomRepository = roomRepository;
        this.roomCodeGenerator = roomCodeGenerator;
        this.roomMapper = roomMapper;
    }

    public RoomSessionResponse createRoom(CreateRoomRequest request) {
        String username = normalizeUsername(request.username());
        Instant now = Instant.now();

        Participant host = new Participant(
                UUID.randomUUID().toString(),
                username,
                RoomRole.HOST,
                now
        );

        Room room = new Room();
        room.setRoomCode(generateUniqueRoomCode());
        room.setHostUserId(host.getUserId());
        room.setVideoId(null);
        room.setPlayState(DEFAULT_PLAY_STATE);
        room.setCurrentTime(0);
        room.setActive(true);
        room.setParticipants(new ArrayList<>(List.of(host)));
        room.setCreatedAt(now);
        room.setUpdatedAt(now);

        Room saved = roomRepository.save(room);
        return roomMapper.toSessionResponse(host, saved);
    }

    public RoomSessionResponse joinRoomById(String roomId, JoinRoomRequest request) {
        if (roomId == null || roomId.isBlank()) {
            throw new BadRequestException("Room id is required");
        }

        Room room = roomRepository.findByIdAndActiveTrue(roomId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        return addParticipant(room, request.username());
    }

    public RoomSessionResponse joinRoomByCode(JoinRoomByCodeRequest request) {
        String roomCode = normalizeRoomCode(request.roomCode());

        Room room = roomRepository.findByRoomCodeIgnoreCaseAndActiveTrue(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found for the given code"));

        return addParticipant(room, request.username());
    }

    public RoomResponse getRoomById(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new BadRequestException("Room id is required");
        }

        Room room = roomRepository.findByIdAndActiveTrue(roomId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));

        return roomMapper.toRoomResponse(room);
    }

    public RoomResponse getRoomByCode(String roomCode) {
        String normalizedCode = normalizeRoomCode(roomCode);

        Room room = roomRepository.findByRoomCodeIgnoreCaseAndActiveTrue(normalizedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found for the given code"));

        return roomMapper.toRoomResponse(room);
    }

    private RoomSessionResponse addParticipant(Room room, String rawUsername) {
        String username = normalizeUsername(rawUsername);

        if (room.getParticipants() == null) {
            room.setParticipants(new ArrayList<>());
        }

        boolean usernameTaken = room.getParticipants().stream()
                .anyMatch(participant -> participant.getUsername().equalsIgnoreCase(username));
        if (usernameTaken) {
            throw new ConflictException("Username is already taken in this room");
        }

        if (room.getParticipants().size() >= MAX_PARTICIPANTS_PER_ROOM) {
            throw new ConflictException("Room is full");
        }

        Participant participant = new Participant(
                UUID.randomUUID().toString(),
                username,
                RoomRole.PARTICIPANT,
                Instant.now()
        );

        room.getParticipants().add(participant);
        room.setUpdatedAt(Instant.now());

        Room saved = roomRepository.save(room);
        return roomMapper.toSessionResponse(participant, saved);
    }

    private String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            String code = roomCodeGenerator.generate();
            if (!roomRepository.existsByRoomCodeIgnoreCase(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Unable to generate a unique room code");
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            throw new BadRequestException("Username is required");
        }
        String normalized = username.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new BadRequestException("Username is required");
        }
        return normalized;
    }

    private String normalizeRoomCode(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new BadRequestException("Room code is required");
        }
        return roomCode.trim().toUpperCase(Locale.ROOT);
    }
}
