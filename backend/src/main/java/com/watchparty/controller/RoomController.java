package com.watchparty.controller;

import com.watchparty.dto.ApiResponse;
import com.watchparty.dto.request.CreateRoomRequest;
import com.watchparty.dto.request.JoinRoomByCodeRequest;
import com.watchparty.dto.request.JoinRoomRequest;
import com.watchparty.dto.response.RoomResponse;
import com.watchparty.dto.response.RoomSessionResponse;
import com.watchparty.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/rooms")
@ConditionalOnProperty(name = "app.mongodb.enabled", havingValue = "true")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomSessionResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request
    ) {
        RoomSessionResponse response = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Room created successfully", response));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<RoomSessionResponse>> joinRoomByCode(
            @Valid @RequestBody JoinRoomByCodeRequest request
    ) {
        RoomSessionResponse response = roomService.joinRoomByCode(request);
        return ResponseEntity.ok(ApiResponse.ok("Joined room successfully", response));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<ApiResponse<RoomSessionResponse>> joinRoomById(
            @PathVariable
            @NotBlank(message = "Room id is required")
            String roomId,
            @Valid @RequestBody JoinRoomRequest request
    ) {
        RoomSessionResponse response = roomService.joinRoomById(roomId, request);
        return ResponseEntity.ok(ApiResponse.ok("Joined room successfully", response));
    }

    @GetMapping("/code/{roomCode}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomByCode(
            @PathVariable
            @NotBlank(message = "Room code is required")
            @Size(min = 6, max = 8, message = "Room code must be 6 to 8 characters")
            @Pattern(regexp = "^[A-Za-z0-9]+$", message = "Room code may contain only letters and numbers")
            String roomCode
    ) {
        return ResponseEntity.ok(ApiResponse.ok(roomService.getRoomByCode(roomCode)));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(
            @PathVariable
            @NotBlank(message = "Room id is required")
            String roomId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(roomService.getRoomById(roomId)));
    }
}
