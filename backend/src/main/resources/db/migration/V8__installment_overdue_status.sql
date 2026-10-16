-- V8: alinha o CHECK de status de installments com o enum da aplicação.
-- V1 permitia ('PENDING','PAID','CANCELED') mas o enum InstallmentStatus
-- tem OVERDUE (gravado no banco ao vencer - decisão 2026-10-16) e não tem
-- CANCELED. Mantém CANCELED no banco para uso futuro sem quebrar nada.

ALTER TABLE installments DROP CONSTRAINT installments_status_check;

ALTER TABLE installments ADD CONSTRAINT installments_status_check
    CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELED'));
