package com.watchparty.service;

import com.watchparty.dto.response.ParticipantResponse;
import com.watchparty.dto.response.RoomResponse;
import com.watchparty.dto.response.RoomSessionResponse;
import com.watchparty.model.document.Participant;
import com.watchparty.model.document.Room;
import java.util.Comparator;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomMapper {

    public RoomResponse toRoomResponse(Room room) {
        List<ParticipantResponse> participants = room.getParticipants().stream()
                .sorted(Comparator
                        .comparing((Participant participant) -> participant.getRole().name())
                        .thenComparing(Participant::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(this::toParticipantResponse)
                .toList();

        return new RoomResponse(
                room.getId(),
                room.getRoomCode(),
                room.getHostUserId(),
                room.getVideoId(),
                room.getPlayState(),
                room.getCurrentTime(),
                room.isActive(),
                participants,
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }

    public ParticipantResponse toParticipantResponse(Participant participant) {
        return new ParticipantResponse(
                participant.getUserId(),
                participant.getUsername(),
                participant.getRole(),
                participant.getJoinedAt()
        );
    }

    public RoomSessionResponse toSessionResponse(Participant participant, Room room) {
        return new RoomSessionResponse(
                participant.getUserId(),
                participant.getUsername(),
                participant.getRole(),
                toRoomResponse(room)
        );
    }
}
