-- Insère un admin par défaut
-- username: admin@STC
-- password: password (bcrypt)

INSERT INTO admins (username, password, created_at, updated_at)
VALUES (
  'admin@STC',
  '$2b$12$b/Z3YY0sccpOV/tcpFTZSessCayO3WYrePKAkXmy/dW4h8h6.m48a',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);


