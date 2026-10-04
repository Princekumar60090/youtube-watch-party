package com.watchparty.model.document;

import com.watchparty.model.enums.RoomRole;
import java.time.Instant;

public class Participant {

    private String userId;
    private String username;
    private RoomRole role;
    private Instant joinedAt;

    public Participant() {
    }

    public Participant(String userId, String username, RoomRole role, Instant joinedAt) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public RoomRole getRole() {
        return role;
    }

    public void setRole(RoomRole role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}
