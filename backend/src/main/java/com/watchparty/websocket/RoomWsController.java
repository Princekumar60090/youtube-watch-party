package com.watchparty.websocket;

import com.watchparty.dto.websocket.AssignRoleWsRequest;
import com.watchparty.dto.websocket.ChangeVideoWsRequest;
import com.watchparty.dto.websocket.JoinRoomWsRequest;
import com.watchparty.dto.websocket.LeaveRoomWsRequest;
import com.watchparty.dto.websocket.PlaybackControlWsRequest;
import com.watchparty.dto.websocket.RemoveParticipantWsRequest;
import com.watchparty.dto.websocket.SeekWsRequest;
import com.watchparty.dto.websocket.SendChatWsRequest;
import com.watchparty.dto.websocket.SendReactionWsRequest;
import com.watchparty.dto.websocket.SetChatPermissionsWsRequest;
import com.watchparty.dto.websocket.SyncTimeWsRequest;
import com.watchparty.dto.websocket.TransferHostWsRequest;
import com.watchparty.service.RoomRealtimeService;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

@Controller
@Validated
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomWsController {

    private final RoomRealtimeService roomRealtimeService;

    public RoomWsController(RoomRealtimeService roomRealtimeService) {
        this.roomRealtimeService = roomRealtimeService;
    }

    @MessageMapping("/room.join")
    public void join(@Valid @Payload JoinRoomWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.joinRoom(request, accessor);
    }

    @MessageMapping("/room.leave")
    public void leave(@Valid @Payload LeaveRoomWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.leaveRoom(request, accessor);
    }

    @MessageMapping("/room.play")
    public void play(@Valid @Payload PlaybackControlWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.play(request, accessor);
    }

    @MessageMapping("/room.pause")
    public void pause(@Valid @Payload PlaybackControlWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.pause(request, accessor);
    }

    @MessageMapping("/room.seek")
    public void seek(@Valid @Payload SeekWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.seek(request, accessor);
    }

    @MessageMapping("/room.syncTime")
    public void syncTime(@Valid @Payload SyncTimeWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.syncTime(request, accessor);
    }

    @MessageMapping("/room.changeVideo")
    public void changeVideo(@Valid @Payload ChangeVideoWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.changeVideo(request, accessor);
    }

    @MessageMapping("/room.assignRole")
    public void assignRole(@Valid @Payload AssignRoleWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.assignRole(request, accessor);
    }

    @MessageMapping("/room.removeParticipant")
    public void removeParticipant(
            @Valid @Payload RemoveParticipantWsRequest request,
            SimpMessageHeaderAccessor accessor
    ) {
        roomRealtimeService.removeParticipant(request, accessor);
    }

    @MessageMapping("/room.transferHost")
    public void transferHost(@Valid @Payload TransferHostWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.transferHost(request, accessor);
    }

    @MessageMapping("/room.setChatPermissions")
    public void setChatPermissions(
            @Valid @Payload SetChatPermissionsWsRequest request,
            SimpMessageHeaderAccessor accessor
    ) {
        roomRealtimeService.setChatPermissions(request, accessor);
    }

    @MessageMapping("/room.sendChat")
    public void sendChat(@Valid @Payload SendChatWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.sendChat(request, accessor);
    }

    @MessageMapping("/room.sendReaction")
    public void sendReaction(@Valid @Payload SendReactionWsRequest request, SimpMessageHeaderAccessor accessor) {
        roomRealtimeService.sendReaction(request, accessor);
    }
}
