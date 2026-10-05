package com.watchparty.service;

import com.watchparty.dto.request.CreateRoomRequest;
import com.watchparty.dto.request.JoinRoomByCodeRequest;
import com.watchparty.dto.request.JoinRoomRequest;
import com.watchparty.dto.response.RoomResponse;
import com.watchparty.dto.response.RoomSessionResponse;
import com.watchparty.exception.BadRequestException;
import com.watchparty.exception.ConflictException;
import com.watchparty.exception.ForbiddenException;
import com.watchparty.exception.ResourceNotFoundException;
import com.watchparty.model.document.Participant;
import com.watchparty.model.document.Room;
import com.watchparty.model.enums.RoomRole;
import com.watchparty.repository.RoomRepository;
import com.watchparty.util.YoutubeVideoIdParser;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomService {

    public static final int MAX_PARTICIPANTS_PER_ROOM = 50;
    private static final int MAX_CODE_ATTEMPTS = 8;
    private static final String DEFAULT_PLAY_STATE = "paused";
    private static final Set<RoomRole> ASSIGNABLE_ROLES = EnumSet.of(
            RoomRole.MODERATOR,
            RoomRole.PARTICIPANT,
            RoomRole.VIEWER
    );

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
        Room room = requireActiveRoom(roomId);
        return addParticipant(room, request.username());
    }

    public RoomSessionResponse joinRoomByCode(JoinRoomByCodeRequest request) {
        String roomCode = normalizeRoomCode(request.roomCode());
        Room room = roomRepository.findByRoomCodeIgnoreCaseAndActiveTrue(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found for the given code"));
        return addParticipant(room, request.username());
    }

    public RoomResponse getRoomById(String roomId) {
        return roomMapper.toRoomResponse(requireActiveRoom(roomId));
    }

    public RoomResponse getRoomByCode(String roomCode) {
        String normalizedCode = normalizeRoomCode(roomCode);
        Room room = roomRepository.findByRoomCodeIgnoreCaseAndActiveTrue(normalizedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found for the given code"));
        return roomMapper.toRoomResponse(room);
    }

    public Room requireActiveRoom(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            throw new BadRequestException("Room id is required");
        }
        return roomRepository.findByIdAndActiveTrue(roomId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    public Participant requireParticipant(Room room, String userId) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("User id is required");
        }
        return room.getParticipants().stream()
                .filter(participant -> participant.getUserId().equals(userId.trim()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("User is not a participant of this room"));
    }

    public Room save(Room room) {
        room.setUpdatedAt(Instant.now());
        return roomRepository.save(room);
    }

    public Room updatePlayback(String roomId, String actorUserId, String playState, Double currentTime) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        requirePlaybackControl(actor);

        if (playState != null) {
            room.setPlayState(playState);
        }
        if (currentTime != null) {
            validateNonNegativeTime(currentTime);
            room.setCurrentTime(currentTime);
        }
        return save(room);
    }

    public Room seek(String roomId, String actorUserId, double time) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        requirePlaybackControl(actor);
        validateNonNegativeTime(time);
        room.setCurrentTime(time);
        return save(room);
    }

    public Room changeVideo(String roomId, String actorUserId, String rawVideoId) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        requirePlaybackControl(actor);

        String videoId = YoutubeVideoIdParser.parse(rawVideoId);
        room.setVideoId(videoId);
        room.setCurrentTime(0);
        room.setPlayState(DEFAULT_PLAY_STATE);
        return save(room);
    }

    public Room assignRole(String roomId, String actorUserId, String targetUserId, RoomRole newRole) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        if (!actor.getRole().canManageRoles()) {
            throw new ForbiddenException("Only the host can assign roles");
        }
        if (newRole == null || !ASSIGNABLE_ROLES.contains(newRole)) {
            throw new BadRequestException("Role must be MODERATOR, PARTICIPANT, or VIEWER");
        }

        Participant target = requireParticipant(room, targetUserId);
        if (target.getUserId().equals(room.getHostUserId()) || target.getRole() == RoomRole.HOST) {
            throw new ForbiddenException("Host role cannot be changed with assign_role; use transfer host");
        }

        target.setRole(newRole);
        return save(room);
    }

    public Room removeParticipant(String roomId, String actorUserId, String targetUserId) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        if (!actor.getRole().canRemoveParticipants()) {
            throw new ForbiddenException("Only the host can remove participants");
        }

        Participant target = requireParticipant(room, targetUserId);
        if (target.getUserId().equals(actor.getUserId())) {
            throw new BadRequestException("Host cannot remove themselves");
        }
        if (target.getUserId().equals(room.getHostUserId()) || target.getRole() == RoomRole.HOST) {
            throw new ForbiddenException("Host cannot be removed");
        }

        room.getParticipants().removeIf(participant -> participant.getUserId().equals(target.getUserId()));
        return save(room);
    }

    public Room transferHost(String roomId, String actorUserId, String targetUserId) {
        Room room = requireActiveRoom(roomId);
        Participant actor = requireParticipant(room, actorUserId);
        if (actor.getRole() != RoomRole.HOST) {
            throw new ForbiddenException("Only the host can transfer host role");
        }

        Participant target = requireParticipant(room, targetUserId);
        if (target.getUserId().equals(actor.getUserId())) {
            throw new BadRequestException("Cannot transfer host to yourself");
        }

        actor.setRole(RoomRole.PARTICIPANT);
        target.setRole(RoomRole.HOST);
        room.setHostUserId(target.getUserId());
        return save(room);
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
        Room saved = save(room);
        return roomMapper.toSessionResponse(participant, saved);
    }

    private void requirePlaybackControl(Participant actor) {
        if (!actor.getRole().canControlPlayback()) {
            throw new ForbiddenException("Only host or moderator can control playback");
        }
    }

    private void validateNonNegativeTime(double time) {
        if (time < 0) {
            throw new BadRequestException("Time must be >= 0");
        }
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
