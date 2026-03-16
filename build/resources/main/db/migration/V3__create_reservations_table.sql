CREATE TABLE reservations (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    room_id     BIGINT       NOT NULL REFERENCES rooms(id),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    start_time  TIMESTAMP    NOT NULL,
    end_time    TIMESTAMP    NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reservation_time CHECK (start_time < end_time)
);

CREATE INDEX idx_reservations_user_id   ON reservations (user_id);
CREATE INDEX idx_reservations_room_id   ON reservations (room_id);
CREATE INDEX idx_reservations_room_time ON reservations (room_id, start_time, end_time);
CREATE INDEX idx_reservations_status    ON reservations (status);
