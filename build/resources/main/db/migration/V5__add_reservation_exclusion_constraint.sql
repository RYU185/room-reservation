-- 예약 시간 중복 방지: PostgreSQL EXCLUDE 제약 조건 (동시성 레이스 컨디션 방어)
-- btree_gist 확장이 필요합니다 (tsrange + bigint 복합 EXCLUDE 지원)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
    ADD CONSTRAINT no_overlap_reservation
        EXCLUDE USING gist (
            room_id WITH =,
            tsrange(start_time, end_time, '[)') WITH &&
        ) WHERE (status = 'CONFIRMED');
