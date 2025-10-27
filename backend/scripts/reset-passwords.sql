-- SQL script to reset all user passwords
-- Run this with: docker exec -i ims-postgres psql -U postgres -d user_service_db < reset-passwords.sql

-- Password hashes generated with bcrypt cost 10:
-- admin@ims.com: admin123
-- dilanshanuka999@gmail.com: Dilan@789 (already correct)
-- rasindu1995@gmail.com: Password@123  
-- thisari@gmail.com: Password@123

UPDATE users SET password_hash = '$2b$10$i.2.vPlcYL2Egf74m2m75uvHzgsEmZjKdfAMX0u0em.KmlHvbbw1K' WHERE email = 'admin@ims.com';
UPDATE users SET password_hash = '$2b$10$Od.oayu6ekosNfzq9j55uepqXlNUVqEsSVhbhQkF9BcKLiESvjuXe' WHERE email = 'rasindu1995@gmail.com';
UPDATE users SET password_hash = '$2b$10$Od.oayu6ekosNfzq9j55uepqXlNUVqEsSVhbhQkF9BcKLiESvjuXe' WHERE email = 'thisari@gmail.com';

-- Verify updates
SELECT username, email, 
       CASE 
         WHEN email = 'admin@ims.com' THEN 'admin123'
         WHEN email = 'dilanshanuka999@gmail.com' THEN 'Dilan@789'
         ELSE 'Password@123'
       END as password
FROM users 
ORDER BY id;
